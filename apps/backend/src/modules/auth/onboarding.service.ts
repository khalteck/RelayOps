import type { OnboardingState, OwnerOnboardingInput, SessionUser } from "@relayops/types";
import { DEFAULT_SLA_POLICY } from "@relayops/types";
import mongoose from "mongoose";
import { AppError } from "../../core/errors.js";
import { uniqueSlug } from "../../core/slug.js";
import { AuditEventModel } from "../../models/audit-event.model.js";
import { MembershipModel } from "../../models/membership.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { UserModel } from "../../models/user.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";

export async function onboardingState(userId: string): Promise<OnboardingState> {
  const pending = await MembershipModel.findOne({ userId, status: "pending_onboarding" })
    .sort({ createdAt: -1 })
    .lean();
  if (pending) {
    const [organisation, workspaces] = await Promise.all([
      OrganisationModel.findById(pending.organisationId).select("name").lean(),
      WorkspaceModel.find({ _id: { $in: pending.workspaceIds } })
        .select("name")
        .lean()
    ]);
    if (organisation)
      return {
        required: true,
        kind: "invited",
        membershipId: String(pending._id),
        organisationName: organisation.name,
        role: pending.role,
        workspaceNames: workspaces.map((workspace) => workspace.name)
      };
  }
  const active = await MembershipModel.exists({ userId, status: "active" });
  return active ? { required: false } : { required: true, kind: "owner" };
}

export async function completeOwnerOnboarding(userId: string, input: OwnerOnboardingInput) {
  if (await MembershipModel.exists({ userId }))
    throw new AppError(409, "CONFLICT", "Onboarding is already complete");
  const session = await mongoose.startSession();
  let destinationPath = "";
  try {
    await session.withTransaction(async () => {
      const [organisation] = await OrganisationModel.create(
        [{ name: input.organisationName, slug: uniqueSlug(input.organisationName) }],
        { session }
      );
      if (!organisation) throw new Error("Organisation creation failed");
      const [workspace] = await WorkspaceModel.create(
        [
          {
            organisationId: organisation._id,
            name: input.workspaceName,
            slug: uniqueSlug(input.workspaceName),
            slaPolicy: DEFAULT_SLA_POLICY
          }
        ],
        { session }
      );
      if (!workspace) throw new Error("Workspace creation failed");
      const [membership] = await MembershipModel.create(
        [
          {
            userId,
            organisationId: organisation._id,
            role: "owner",
            workspaceIds: [workspace._id],
            status: "active"
          }
        ],
        { session }
      );
      await UserModel.findByIdAndUpdate(userId, { preferences: input.preferences }, { session });
      await AuditEventModel.create(
        [
          {
            organisationId: organisation._id,
            workspaceId: workspace._id,
            actorId: userId,
            action: "organisation.created",
            entityType: "organisation",
            entityId: organisation._id,
            metadata: { ownerMembershipId: String(membership?._id) }
          }
        ],
        { session }
      );
      destinationPath = `/app/${organisation.slug}/${workspace.slug}/dashboard`;
    });
  } finally {
    await session.endSession();
  }
  return { destinationPath };
}

export async function completeInvitedOnboarding(
  userId: string,
  membershipId: string,
  input: { name: string; preferences: SessionUser["preferences"] }
) {
  const membership = await MembershipModel.findOne({
    _id: membershipId,
    userId,
    status: "pending_onboarding"
  });
  if (!membership) throw new AppError(404, "NOT_FOUND", "Onboarding access was not found");
  const [organisation, workspace] = await Promise.all([
    OrganisationModel.findById(membership.organisationId).select("slug").lean(),
    WorkspaceModel.findById(membership.workspaceIds[0]).select("slug").lean()
  ]);
  if (!organisation || !workspace) throw new AppError(404, "NOT_FOUND", "Workspace was not found");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await UserModel.findByIdAndUpdate(
        userId,
        { name: input.name, preferences: input.preferences },
        { session }
      );
      membership.status = "active";
      await membership.save({ session });
      await AuditEventModel.create(
        [
          {
            organisationId: membership.organisationId,
            workspaceId: membership.workspaceIds[0],
            actorId: userId,
            action: "member.onboarding_completed",
            entityType: "membership",
            entityId: membership._id
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  return { destinationPath: `/app/${organisation.slug}/${workspace.slug}/dashboard` };
}
