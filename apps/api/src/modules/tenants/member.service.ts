import type { WorkspaceMember } from "@relayops/types";
import { MembershipModel } from "../../models/membership.model.js";
import { UserModel } from "../../models/user.model.js";
import { requireWorkspaceAccess } from "./tenant.authorization.js";

export async function listWorkspaceMembers(
  userId: string,
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  const memberships = await MembershipModel.find({
    organisationId: tenant.organisationId,
    $or: [{ role: { $in: ["owner", "administrator"] } }, { workspaceIds: workspaceId }]
  }).lean();
  const users = await UserModel.find({ _id: { $in: memberships.map((item) => item.userId) } })
    .select("name email")
    .lean();

  return memberships.flatMap((membership) => {
    const user = users.find((item) => String(item._id) === String(membership.userId));
    return user
      ? [{ id: String(user._id), name: user.name, email: user.email, role: membership.role }]
      : [];
  });
}
