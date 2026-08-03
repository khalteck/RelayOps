import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import type {
  AcceptInvitationInput,
  InvitationDto,
  InvitationPreviewDto,
  InviteMemberInput,
  OrganisationMemberDto,
  PersonSummary
} from "@relayops/types";
import mongoose, { Types } from "mongoose";
import { getEnv } from "../../config/env.js";
import { AppError } from "../../core/errors.js";
import { AuditEventModel } from "../../models/audit-event.model.js";
import { InvitationModel, type InvitationDocument } from "../../models/invitation.model.js";
import { MembershipModel } from "../../models/membership.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { UserModel } from "../../models/user.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { createNotification } from "../notifications/notification.service.js";
import { requireOrganisationAccess } from "./tenant.authorization.js";

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function invitationStatus(
  invitation: InvitationDocument & { _id: unknown }
): InvitationDto["status"] {
  if (invitation.acceptedAt) return "accepted";
  return invitation.expiresAt <= new Date() ? "expired" : "pending";
}

function toInvitation(
  invitation: InvitationDocument & { _id: unknown },
  inviter: PersonSummary,
  acceptUrl?: string
): InvitationDto {
  return {
    id: String(invitation._id),
    email: invitation.email,
    role: invitation.role,
    workspaceIds: invitation.workspaceIds.map(String),
    invitedBy: inviter,
    status: invitationStatus(invitation),
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    ...(acceptUrl ? { acceptUrl } : {})
  };
}

async function requireOrganisationWorkspaces(
  organisationId: string,
  workspaceIds: string[]
): Promise<void> {
  if (workspaceIds.some((id) => !Types.ObjectId.isValid(id))) {
    throw new AppError(400, "VALIDATION_ERROR", "One or more workspaces are invalid");
  }
  const count = await WorkspaceModel.countDocuments({
    _id: { $in: workspaceIds },
    organisationId
  });
  if (count !== new Set(workspaceIds).size) {
    throw new AppError(400, "VALIDATION_ERROR", "All workspaces must belong to the organisation");
  }
}

export async function listOrganisationMembers(
  userId: string,
  organisationId: string
): Promise<OrganisationMemberDto[]> {
  await requireOrganisationAccess(userId, organisationId, "members:manage");
  const memberships = await MembershipModel.find({ organisationId }).sort({ createdAt: 1 }).lean();
  const users = await UserModel.find({ _id: { $in: memberships.map((item) => item.userId) } })
    .select("name email")
    .lean();
  const byId = new Map(users.map((user) => [String(user._id), user]));
  return memberships.flatMap((membership) => {
    const user = byId.get(String(membership.userId));
    return user
      ? [
          {
            membershipId: String(membership._id),
            user: { id: String(user._id), name: user.name, email: user.email },
            role: membership.role,
            workspaceIds: membership.workspaceIds.map(String),
            joinedAt: membership.createdAt.toISOString()
          }
        ]
      : [];
  });
}

export async function listInvitations(
  userId: string,
  organisationId: string
): Promise<InvitationDto[]> {
  await requireOrganisationAccess(userId, organisationId, "members:manage");
  const invitations = await InvitationModel.find({ organisationId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const users = await UserModel.find({ _id: { $in: invitations.map((item) => item.invitedById) } })
    .select("name email")
    .lean();
  const byId = new Map(users.map((user) => [String(user._id), user]));
  return invitations.flatMap((invitation) => {
    const inviter = byId.get(String(invitation.invitedById));
    return inviter
      ? [
          toInvitation(invitation, {
            id: String(inviter._id),
            name: inviter.name,
            email: inviter.email
          })
        ]
      : [];
  });
}

export async function inviteMember(
  userId: string,
  organisationId: string,
  input: InviteMemberInput
): Promise<InvitationDto> {
  await requireOrganisationAccess(userId, organisationId, "members:manage");
  await requireOrganisationWorkspaces(organisationId, input.workspaceIds);
  const existingUser = await UserModel.findOne({ email: input.email }).select("_id").lean();
  if (
    existingUser &&
    (await MembershipModel.exists({ organisationId, userId: existingUser._id }))
  ) {
    throw new AppError(409, "CONFLICT", "This user already belongs to the organisation");
  }
  const token = randomBytes(32).toString("base64url");
  const invitation = await InvitationModel.create({
    organisationId,
    invitedById: userId,
    email: input.email,
    role: input.role,
    workspaceIds: [...new Set(input.workspaceIds)],
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000)
  });
  await AuditEventModel.create({
    organisationId,
    workspaceId: input.workspaceIds[0],
    actorId: userId,
    action: "member.invited",
    entityType: "invitation",
    entityId: invitation._id,
    metadata: { email: input.email, role: input.role, workspaceIds: input.workspaceIds }
  });
  const inviter = await UserModel.findById(userId).select("name email").lean();
  if (!inviter) throw new AppError(404, "NOT_FOUND", "Inviting user was not found");
  return toInvitation(
    invitation,
    { id: String(inviter._id), name: inviter.name, email: inviter.email },
    `${getEnv().WEB_ORIGIN}/accept-invite/${token}`
  );
}

async function findInvitation(token: string) {
  const invitation = await InvitationModel.findOne({ tokenHash: tokenHash(token) });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    throw new AppError(404, "NOT_FOUND", "This invitation is invalid or has expired");
  }
  return invitation;
}

export async function invitationPreview(token: string): Promise<InvitationPreviewDto> {
  const invitation = await findInvitation(token);
  const [organisation, workspaces, inviter, existingUser] = await Promise.all([
    OrganisationModel.findById(invitation.organisationId).select("name").lean(),
    WorkspaceModel.find({ _id: { $in: invitation.workspaceIds } })
      .select("name slug")
      .lean(),
    UserModel.findById(invitation.invitedById).select("name").lean(),
    UserModel.exists({ email: invitation.email })
  ]);
  if (!organisation || !inviter) throw new AppError(404, "NOT_FOUND", "Invitation tenant missing");
  return {
    email: invitation.email,
    role: invitation.role,
    organisationName: organisation.name,
    workspaces: workspaces.map((workspace) => ({
      id: String(workspace._id),
      name: workspace.name,
      slug: workspace.slug
    })),
    invitedByName: inviter.name,
    expiresAt: invitation.expiresAt.toISOString(),
    accountExists: Boolean(existingUser)
  };
}

export async function acceptInvitation(
  token: string,
  input: AcceptInvitationInput,
  requestId?: string
): Promise<{ email: string }> {
  const invitation = await findInvitation(token);
  let user = await UserModel.findOne({ email: invitation.email }).select("_id name email");
  if (!user && (!input.name || !input.password)) {
    throw new AppError(400, "VALIDATION_ERROR", "Name and password are required for a new account");
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (!user) {
        const [created] = await UserModel.create(
          [
            {
              name: input.name!,
              email: invitation.email,
              passwordHash: await hash(input.password!, 12)
            }
          ],
          { session }
        );
        if (!created) throw new Error("Invited account creation failed");
        user = created;
      }
      await MembershipModel.findOneAndUpdate(
        { userId: user._id, organisationId: invitation.organisationId },
        { role: invitation.role, workspaceIds: invitation.workspaceIds },
        { upsert: true, new: true, session }
      );
      invitation.acceptedAt = new Date();
      await invitation.save({ session });
      await AuditEventModel.create(
        [
          {
            organisationId: invitation.organisationId,
            workspaceId: invitation.workspaceIds[0],
            actorId: user._id,
            action: "member.invitation_accepted",
            entityType: "invitation",
            entityId: invitation._id,
            metadata: { role: invitation.role, email: invitation.email },
            ...(requestId ? { requestId } : {})
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  if (!user) throw new Error("Invited account was not created");
  const [organisation, workspace] = await Promise.all([
    OrganisationModel.findById(invitation.organisationId).select("name slug").lean(),
    WorkspaceModel.findById(invitation.workspaceIds[0]).select("slug").lean()
  ]);
  if (organisation) {
    await createNotification({
      userId: String(user._id),
      kind: "membership_added",
      title: `Welcome to ${organisation.name}`,
      message: `Your ${invitation.role} access is ready.`,
      organisationId: String(invitation.organisationId),
      ...(invitation.workspaceIds[0] ? { workspaceId: String(invitation.workspaceIds[0]) } : {}),
      ...(workspace
        ? { resourcePath: `/app/${organisation.slug}/${workspace.slug}/dashboard` }
        : {})
    });
  }
  return { email: invitation.email };
}
