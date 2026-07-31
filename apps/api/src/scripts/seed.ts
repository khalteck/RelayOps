import { hash } from "bcryptjs";
import { DEFAULT_SLA_POLICY, type Role } from "@relayops/types";
import { getEnv } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../core/database.js";
import { logger } from "../core/logger.js";
import { MembershipModel } from "../models/membership.model.js";
import { OrganisationModel } from "../models/organisation.model.js";
import { UserModel } from "../models/user.model.js";
import { WorkspaceModel } from "../models/workspace.model.js";

const demoUsers: Array<{ role: Role; name: string; email: string }> = [
  { role: "owner", name: "Olivia Owner", email: "owner@relayops.demo" },
  { role: "administrator", name: "Avery Admin", email: "admin@relayops.demo" },
  { role: "responder", name: "Riley Responder", email: "responder@relayops.demo" },
  { role: "viewer", name: "Victor Viewer", email: "viewer@relayops.demo" }
];

async function seed(): Promise<void> {
  const password = getEnv().DEMO_PASSWORD;
  if (!password) throw new Error("DEMO_PASSWORD is required to seed demo accounts");
  await connectDatabase();
  const passwordHash = await hash(password, 12);

  const organisation =
    (await OrganisationModel.findOne({ slug: "relay-labs-demo" })) ??
    (await OrganisationModel.create({ name: "Relay Labs", slug: "relay-labs-demo" }));
  const workspace =
    (await WorkspaceModel.findOne({ organisationId: organisation._id, slug: "platform" })) ??
    (await WorkspaceModel.create({
      organisationId: organisation._id,
      name: "Platform",
      slug: "platform",
      slaPolicy: DEFAULT_SLA_POLICY
    }));

  for (const demo of demoUsers) {
    const user = await UserModel.findOneAndUpdate(
      { email: demo.email },
      { name: demo.name, email: demo.email, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await MembershipModel.findOneAndUpdate(
      { userId: user._id, organisationId: organisation._id },
      { role: demo.role, workspaceIds: [workspace._id] },
      { upsert: true, new: true }
    );
  }

  // A second organisation makes tenant switching visible in the Stage 1 demo.
  const second =
    (await OrganisationModel.findOne({ slug: "northstar-demo" })) ??
    (await OrganisationModel.create({ name: "Northstar Commerce", slug: "northstar-demo" }));
  const secondWorkspace =
    (await WorkspaceModel.findOne({ organisationId: second._id, slug: "checkout" })) ??
    (await WorkspaceModel.create({
      organisationId: second._id,
      name: "Checkout",
      slug: "checkout",
      slaPolicy: DEFAULT_SLA_POLICY
    }));
  const owner = await UserModel.findOne({ email: "owner@relayops.demo" });
  if (owner) {
    await MembershipModel.findOneAndUpdate(
      { userId: owner._id, organisationId: second._id },
      { role: "owner", workspaceIds: [secondWorkspace._id] },
      { upsert: true }
    );
  }
  logger.info({ accounts: demoUsers.length, organisations: 2 }, "Demo accounts seeded");
}

seed()
  .then(disconnectDatabase)
  .catch((error: unknown) => {
    logger.error({ err: error }, "Demo seed failed");
    process.exitCode = 1;
  });
