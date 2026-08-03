import { hash } from "bcryptjs";
import { DEFAULT_SLA_POLICY } from "@relayops/types";
import type { Types } from "mongoose";
import { MembershipModel } from "../../models/membership.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { UserModel } from "../../models/user.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { DEMO_TENANTS, DEMO_USERS } from "./definitions.js";

export interface SeedContext {
  users: Map<string, Types.ObjectId>;
  workspaces: Array<{
    organisationId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    organisationSlug: string;
    workspaceSlug: string;
  }>;
}

export async function seedTenants(password: string): Promise<SeedContext> {
  const passwordHash = await hash(password, 12);
  const users = new Map<string, Types.ObjectId>();
  for (const definition of DEMO_USERS) {
    const user = await UserModel.findOneAndUpdate(
      { email: definition.email },
      { ...definition, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    users.set(definition.email, user._id);
  }

  const workspaces: SeedContext["workspaces"] = [];
  for (const tenant of DEMO_TENANTS) {
    const organisation = await OrganisationModel.findOneAndUpdate(
      { slug: tenant.slug },
      { name: tenant.name, slug: tenant.slug },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const tenantWorkspaces = [];
    for (const definition of tenant.workspaces) {
      const workspace = await WorkspaceModel.findOneAndUpdate(
        { organisationId: organisation._id, slug: definition.slug },
        { ...definition, organisationId: organisation._id, slaPolicy: DEFAULT_SLA_POLICY },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      tenantWorkspaces.push(workspace._id);
      workspaces.push({
        organisationId: organisation._id,
        workspaceId: workspace._id,
        organisationSlug: tenant.slug,
        workspaceSlug: definition.slug
      });
    }

    for (const definition of DEMO_USERS) {
      const userId = users.get(definition.email);
      if (!userId) continue;
      const scopedWorkspaces = ["owner", "administrator"].includes(definition.role)
        ? tenantWorkspaces
        : tenantWorkspaces.slice(0, 1);
      await MembershipModel.findOneAndUpdate(
        { userId, organisationId: organisation._id },
        { role: definition.role, workspaceIds: scopedWorkspaces },
        { upsert: true, new: true }
      );
    }
  }
  return { users, workspaces };
}
