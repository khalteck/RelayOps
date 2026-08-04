import type { MembershipStatusInput } from "@relayops/types";
import mongoose from "mongoose";
import { AppError } from "../../core/errors.js";
import { AuditEventModel } from "../../models/audit-event.model.js";
import { IncidentModel } from "../../models/incident.model.js";
import { MembershipModel } from "../../models/membership.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { UserModel } from "../../models/user.model.js";
import { queueEmail } from "../email/email.service.js";
import { publishAccessChange } from "../realtime/realtime.publisher.js";
import { requireOrganisationAccess } from "./tenant.authorization.js";

async function targetMember(actorId: string, organisationId: string, membershipId: string) {
  const actor = await requireOrganisationAccess(actorId, organisationId, "members:manage");
  if (actor.role !== "owner")
    throw new AppError(403, "FORBIDDEN", "Only owners can manage member access");
  const membership = await MembershipModel.findOne({ _id: membershipId, organisationId });
  if (!membership) throw new AppError(404, "NOT_FOUND", "Member was not found");
  if (membership.role === "owner" || String(membership.userId) === actorId)
    throw new AppError(403, "FORBIDDEN", "Owner access cannot be changed");
  const unresolved = await IncidentModel.countDocuments({
    organisationId,
    assigneeId: membership.userId,
    status: { $ne: "resolved" }
  });
  if (unresolved)
    throw new AppError(
      409,
      "CONFLICT",
      `Reassign or resolve ${unresolved} open incident${unresolved === 1 ? "" : "s"} first`,
      { openIncidentCount: unresolved }
    );
  const user = await UserModel.findById(membership.userId).select("name email").lean();
  const organisation = await OrganisationModel.findById(organisationId).select("name").lean();
  if (!user || !organisation) throw new AppError(404, "NOT_FOUND", "Member was not found");
  return { membership, user, organisation };
}

export async function changeMemberStatus(
  actorId: string,
  organisationId: string,
  membershipId: string,
  input: MembershipStatusInput
) {
  const target = await targetMember(actorId, organisationId, membershipId);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      target.membership.status = input.status;
      if (input.status === "suspended") {
        target.membership.suspendedAt = new Date();
        target.membership.suspendedById = new mongoose.Types.ObjectId(actorId);
      } else {
        target.membership.set("suspendedAt", undefined);
        target.membership.set("suspendedById", undefined);
      }
      await target.membership.save({ session });
      await AuditEventModel.create(
        [
          {
            organisationId,
            workspaceId: target.membership.workspaceIds[0],
            actorId,
            action: `member.${input.status === "suspended" ? "suspended" : "restored"}`,
            entityType: "membership",
            entityId: target.membership._id,
            metadata: { userId: String(target.membership.userId) }
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  await queueEmail({
    kind: input.status === "suspended" ? "suspended" : "restored",
    to: target.user.email,
    payload: {
      recipientName: target.user.name,
      title: `Your ${target.organisation.name} access was ${input.status === "suspended" ? "suspended" : "restored"}`,
      intro:
        input.status === "suspended"
          ? "An organisation owner suspended your workspace access. Contact your owner if you believe this was unexpected."
          : "An organisation owner restored your workspace access. You can sign in to continue.",
      detail: "This is a mandatory account access notification."
    }
  });
  publishAccessChange(String(target.membership.userId), organisationId, input.status);
  return { status: input.status };
}

export async function removeMember(
  actorId: string,
  organisationId: string,
  membershipId: string
): Promise<void> {
  const target = await targetMember(actorId, organisationId, membershipId);
  const userId = String(target.membership.userId);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await target.membership.deleteOne({ session });
      await AuditEventModel.create(
        [
          {
            organisationId,
            workspaceId: target.membership.workspaceIds[0],
            actorId,
            action: "member.removed",
            entityType: "membership",
            entityId: target.membership._id,
            metadata: { userId, email: target.user.email }
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  await queueEmail({
    kind: "removed",
    to: target.user.email,
    payload: {
      recipientName: target.user.name,
      title: `Your ${target.organisation.name} access was removed`,
      intro:
        "An organisation owner removed your RelayOps workspace access. Your account and activity history remain intact.",
      detail: "Contact the organisation owner if you believe this was unexpected."
    }
  });
  publishAccessChange(userId, organisationId, "removed");
}
