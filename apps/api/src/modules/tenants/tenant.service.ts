import {
  DEFAULT_SLA_POLICY,
  permissionsFor,
  type OrganisationSummary,
  type SlaPolicy,
  type WorkspaceSummary
} from "@relayops/types";
import mongoose from "mongoose";
import { AppError } from "../../core/errors.js";
import { uniqueSlug } from "../../core/slug.js";
import { MembershipModel } from "../../models/membership.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { requireOrganisationAccess, requireWorkspaceAccess } from "./tenant.authorization.js";

function workspaceDto(workspace: {
  _id: unknown;
  organisationId: unknown;
  name: string;
  slug: string;
  slaPolicy: SlaPolicy;
}): WorkspaceSummary {
  return {
    id: String(workspace._id),
    organisationId: String(workspace.organisationId),
    name: workspace.name,
    slug: workspace.slug,
    slaPolicy: workspace.slaPolicy
  };
}

export async function listOrganisations(userId: string): Promise<OrganisationSummary[]> {
  const memberships = await MembershipModel.find({ userId }).lean();
  const organisations = await OrganisationModel.find({
    _id: { $in: memberships.map((membership) => membership.organisationId) }
  }).lean();
  const allWorkspaces = await WorkspaceModel.find({
    organisationId: { $in: organisations.map((organisation) => organisation._id) }
  }).lean();

  return memberships.flatMap((membership) => {
    const organisation = organisations.find(
      (item) => String(item._id) === String(membership.organisationId)
    );
    if (!organisation) return [];
    const privileged = ["owner", "administrator"].includes(membership.role);
    const allowedIds = new Set(membership.workspaceIds.map(String));
    const workspaces = allWorkspaces
      .filter(
        (workspace) =>
          String(workspace.organisationId) === String(organisation._id) &&
          (privileged || allowedIds.has(String(workspace._id)))
      )
      .map(workspaceDto);
    return [
      {
        id: String(organisation._id),
        name: organisation.name,
        slug: organisation.slug,
        role: membership.role,
        permissions: permissionsFor(membership.role),
        workspaces
      }
    ];
  });
}

export async function createOrganisation(
  userId: string,
  name: string
): Promise<OrganisationSummary> {
  const session = await mongoose.startSession();
  let organisationId = "";
  try {
    await session.withTransaction(async () => {
      const [organisation] = await OrganisationModel.create([{ name, slug: uniqueSlug(name) }], {
        session
      });
      if (!organisation) throw new Error("Organisation creation failed");
      const [workspace] = await WorkspaceModel.create(
        [
          {
            organisationId: organisation._id,
            name: "General",
            slug: uniqueSlug("General"),
            slaPolicy: DEFAULT_SLA_POLICY
          }
        ],
        { session }
      );
      if (!workspace) throw new Error("Workspace creation failed");
      await MembershipModel.create(
        [
          {
            userId,
            organisationId: organisation._id,
            role: "owner",
            workspaceIds: [workspace._id]
          }
        ],
        { session }
      );
      organisationId = String(organisation._id);
    });
  } finally {
    await session.endSession();
  }
  const result = (await listOrganisations(userId)).find((item) => item.id === organisationId);
  if (!result) throw new AppError(500, "INTERNAL_ERROR", "Organisation creation failed");
  return result;
}

export async function updateOrganisation(
  userId: string,
  organisationId: string,
  name: string
): Promise<void> {
  await requireOrganisationAccess(userId, organisationId, "organisation:update");
  const result = await OrganisationModel.updateOne({ _id: organisationId }, { name });
  if (!result.matchedCount) throw new AppError(404, "NOT_FOUND", "Organisation was not found");
}

export async function createWorkspace(
  userId: string,
  organisationId: string,
  name: string
): Promise<WorkspaceSummary> {
  await requireOrganisationAccess(userId, organisationId, "workspace:create");
  const workspace = await WorkspaceModel.create({
    organisationId,
    name,
    slug: uniqueSlug(name),
    slaPolicy: DEFAULT_SLA_POLICY
  });
  return workspaceDto(workspace);
}

export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  changes: { name?: string; slaPolicy?: SlaPolicy }
): Promise<WorkspaceSummary> {
  await requireWorkspaceAccess(
    userId,
    workspaceId,
    changes.slaPolicy ? "sla:update" : "workspace:update"
  );
  const workspace = await WorkspaceModel.findByIdAndUpdate(workspaceId, changes, {
    new: true,
    runValidators: true
  }).lean();
  if (!workspace) throw new AppError(404, "NOT_FOUND", "Workspace was not found");
  return workspaceDto(workspace);
}
