import type { SavedViewDefinition, SavedViewDto } from "@relayops/types";
import { Types } from "mongoose";
import { AppError } from "../../core/errors.js";
import { SavedViewModel } from "../../models/saved-view.model.js";
import { requireWorkspaceAccess } from "../tenants/tenant.authorization.js";

function savedViewDto(view: {
  _id: unknown;
  workspaceId: unknown;
  name: string;
  definition: SavedViewDefinition;
  createdAt: Date;
  updatedAt: Date;
}): SavedViewDto {
  return {
    id: String(view._id),
    workspaceId: String(view.workspaceId),
    name: view.name,
    definition: view.definition,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString()
  };
}

export async function listSavedViews(userId: string, workspaceId: string): Promise<SavedViewDto[]> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId, "saved-view:manage");
  const views = await SavedViewModel.find({
    organisationId: tenant.organisationId,
    workspaceId,
    userId
  })
    .sort({ updatedAt: -1 })
    .lean();
  return views.map(savedViewDto);
}

export async function saveView(
  userId: string,
  workspaceId: string,
  input: { name: string; definition: SavedViewDefinition },
  viewId?: string
): Promise<SavedViewDto> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId, "saved-view:manage");
  if (viewId && !Types.ObjectId.isValid(viewId))
    throw new AppError(404, "NOT_FOUND", "Saved view not found");
  try {
    const view = viewId
      ? await SavedViewModel.findOneAndUpdate(
          { _id: viewId, organisationId: tenant.organisationId, workspaceId, userId },
          input,
          { new: true, runValidators: true }
        ).lean()
      : await SavedViewModel.create({
          organisationId: tenant.organisationId,
          workspaceId,
          userId,
          ...input
        });
    if (!view) throw new AppError(404, "NOT_FOUND", "Saved view not found");
    return savedViewDto(view);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11_000) {
      throw new AppError(409, "CONFLICT", "A saved view with this name already exists");
    }
    throw error;
  }
}

export async function deleteSavedView(
  userId: string,
  workspaceId: string,
  viewId: string
): Promise<void> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId, "saved-view:manage");
  if (!Types.ObjectId.isValid(viewId)) throw new AppError(404, "NOT_FOUND", "Saved view not found");
  const result = await SavedViewModel.deleteOne({
    _id: viewId,
    organisationId: tenant.organisationId,
    workspaceId,
    userId
  });
  if (!result.deletedCount) throw new AppError(404, "NOT_FOUND", "Saved view not found");
}
