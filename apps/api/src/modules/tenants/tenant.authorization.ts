import { hasPermission, type Permission, type Role } from "@relayops/types";
import { Types } from "mongoose";
import { AppError } from "../../core/errors.js";
import { MembershipModel } from "../../models/membership.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";

export interface TenantAccess {
  userId: string;
  organisationId: string;
  role: Role;
  workspaceIds: string[];
}

export async function requireOrganisationAccess(
  userId: string,
  organisationId: string,
  permission?: Permission
): Promise<TenantAccess> {
  if (!Types.ObjectId.isValid(organisationId)) {
    throw new AppError(404, "NOT_FOUND", "Organisation was not found");
  }
  const membership = await MembershipModel.findOne({ userId, organisationId }).lean();
  if (!membership) throw new AppError(404, "NOT_FOUND", "Organisation was not found");
  if (permission && !hasPermission(membership.role, permission)) {
    throw new AppError(403, "FORBIDDEN", "Your role cannot perform this action");
  }
  return {
    userId,
    organisationId,
    role: membership.role,
    workspaceIds: membership.workspaceIds.map(String)
  };
}

export async function requireWorkspaceAccess(
  userId: string,
  workspaceId: string,
  permission?: Permission
): Promise<TenantAccess> {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError(404, "NOT_FOUND", "Workspace was not found");
  }
  const workspace = await WorkspaceModel.findById(workspaceId).select("organisationId").lean();
  if (!workspace) throw new AppError(404, "NOT_FOUND", "Workspace was not found");
  const membership = await MembershipModel.findOne({
    userId,
    organisationId: workspace.organisationId,
    $or: [{ role: { $in: ["owner", "administrator"] } }, { workspaceIds: workspaceId }]
  }).lean();
  if (!membership) throw new AppError(404, "NOT_FOUND", "Workspace was not found");
  if (permission && !hasPermission(membership.role, permission)) {
    throw new AppError(403, "FORBIDDEN", "Your role cannot perform this action");
  }
  return {
    userId,
    organisationId: String(membership.organisationId),
    role: membership.role,
    workspaceIds: membership.workspaceIds.map(String)
  };
}
