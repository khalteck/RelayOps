import { hash } from "bcryptjs";
import { DEFAULT_SLA_POLICY, type Role } from "@relayops/types";
import { getEnv } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../core/database.js";
import { logger } from "../core/logger.js";
import { AuditEventModel } from "../models/audit-event.model.js";
import { IncidentModel } from "../models/incident.model.js";
import { MembershipModel } from "../models/membership.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { OrganisationModel } from "../models/organisation.model.js";
import { TimelineModel } from "../models/timeline.model.js";
import { UserModel } from "../models/user.model.js";
import { WorkspaceModel } from "../models/workspace.model.js";

const demoUsers: Array<{ role: Role; name: string; email: string }> = [
  { role: "owner", name: "Olivia Owner", email: "owner@relayops.demo" },
  { role: "administrator", name: "Avery Admin", email: "admin@relayops.demo" },
  { role: "responder", name: "Riley Responder", email: "responder@relayops.demo" },
  { role: "viewer", name: "Victor Viewer", email: "viewer@relayops.demo" }
];

async function seedIncidents(organisationId: unknown, workspaceId: unknown): Promise<number> {
  const users = await UserModel.find({
    email: { $in: demoUsers.map((user) => user.email) }
  }).lean();
  const byEmail = new Map(users.map((user) => [user.email, user]));
  const owner = byEmail.get("owner@relayops.demo");
  const admin = byEmail.get("admin@relayops.demo");
  const responder = byEmail.get("responder@relayops.demo");
  if (!owner || !admin || !responder) return 0;
  const now = Date.now();
  const definitions = [
    {
      title: "Elevated Platform API latency",
      description: "The Platform API latency is above the customer-facing error budget.",
      affectedService: "Platform API",
      priority: "P1" as const,
      severity: "SEV1" as const,
      status: "reported" as const,
      reporterId: owner._id,
      reportedAt: new Date(now - 18 * 60_000)
    },
    {
      title: "Checkout payment retries increasing",
      description: "Payment authorization retries are elevated across two checkout regions.",
      affectedService: "Checkout API",
      priority: "P2" as const,
      severity: "SEV2" as const,
      status: "acknowledged" as const,
      reporterId: admin._id,
      assigneeId: responder._id,
      reportedAt: new Date(now - 70 * 60_000),
      acknowledgedAfterMinutes: 12
    },
    {
      title: "Webhook deliveries delayed",
      description: "A growing webhook queue is delaying partner event delivery.",
      affectedService: "Event Gateway",
      priority: "P2" as const,
      severity: "SEV3" as const,
      status: "investigating" as const,
      reporterId: owner._id,
      assigneeId: admin._id,
      reportedAt: new Date(now - 3 * 3_600_000),
      acknowledgedAfterMinutes: 9
    },
    {
      title: "Stale catalogue search results",
      description: "Search indexing lag briefly exposed stale catalogue results to customers.",
      affectedService: "Search Indexer",
      priority: "P3" as const,
      severity: "SEV3" as const,
      status: "resolved" as const,
      reporterId: responder._id,
      assigneeId: responder._id,
      reportedAt: new Date(now - 26 * 3_600_000),
      acknowledgedAfterMinutes: 28,
      resolvedAfterMinutes: 190
    }
  ];

  for (const definition of definitions) {
    const { acknowledgedAfterMinutes, resolvedAfterMinutes, ...incidentFields } = definition;
    const target = DEFAULT_SLA_POLICY[definition.priority];
    const incident = await IncidentModel.findOneAndUpdate(
      { organisationId, workspaceId, title: definition.title },
      {
        ...incidentFields,
        organisationId,
        workspaceId,
        sla: {
          sourcePriority: definition.priority,
          acknowledgeTargetMinutes: target.acknowledgeMinutes,
          resolveTargetMinutes: target.resolveMinutes,
          acknowledgeDueAt: new Date(
            definition.reportedAt.getTime() + target.acknowledgeMinutes * 60_000
          ),
          resolveDueAt: new Date(definition.reportedAt.getTime() + target.resolveMinutes * 60_000),
          ...(acknowledgedAfterMinutes
            ? {
                acknowledgedAt: new Date(
                  definition.reportedAt.getTime() + acknowledgedAfterMinutes * 60_000
                )
              }
            : {}),
          ...(resolvedAfterMinutes
            ? {
                resolvedAt: new Date(
                  definition.reportedAt.getTime() + resolvedAfterMinutes * 60_000
                )
              }
            : {})
        },
        revision: 1
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await TimelineModel.findOneAndUpdate(
      { incidentId: incident._id, kind: "incident_created" },
      {
        organisationId,
        workspaceId,
        incidentId: incident._id,
        actorId: definition.reporterId,
        kind: "incident_created",
        metadata: { seeded: true }
      },
      { upsert: true }
    );
    await AuditEventModel.findOneAndUpdate(
      { entityId: incident._id, action: "incident.created" },
      {
        organisationId,
        workspaceId,
        actorId: definition.reporterId,
        action: "incident.created",
        entityType: "incident",
        entityId: incident._id,
        metadata: { seeded: true }
      },
      { upsert: true }
    );
  }
  return definitions.length;
}

async function seedNotifications(organisationId: unknown, workspaceId: unknown): Promise<void> {
  const [owner, responder, p1, checkout] = await Promise.all([
    UserModel.findOne({ email: "owner@relayops.demo" }).lean(),
    UserModel.findOne({ email: "responder@relayops.demo" }).lean(),
    IncidentModel.findOne({
      organisationId,
      workspaceId,
      title: "Elevated Platform API latency"
    }).lean(),
    IncidentModel.findOne({
      organisationId,
      workspaceId,
      title: "Checkout payment retries increasing"
    }).lean()
  ]);
  const entries = [
    owner && p1
      ? {
          userId: owner._id,
          kind: "incident_updated" as const,
          title: "P1 incident needs acknowledgement",
          message: p1.title,
          resourcePath: `/app/relay-labs-demo/platform/incidents?incident=${String(p1._id)}`
        }
      : null,
    responder && checkout
      ? {
          userId: responder._id,
          kind: "incident_assigned" as const,
          title: "Incident assigned to you",
          message: checkout.title,
          resourcePath: `/app/relay-labs-demo/platform/incidents?incident=${String(checkout._id)}`
        }
      : null
  ].filter((entry) => entry !== null);
  for (const entry of entries) {
    await NotificationModel.findOneAndUpdate(
      { userId: entry.userId, title: entry.title },
      { $set: { ...entry, organisationId, workspaceId }, $unset: { readAt: 1 } },
      { upsert: true, new: true }
    );
  }
}

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
  const incidents = await seedIncidents(organisation._id, workspace._id);
  await seedNotifications(organisation._id, workspace._id);
  logger.info({ accounts: demoUsers.length, organisations: 2, incidents }, "Demo data seeded");
}

seed()
  .then(disconnectDatabase)
  .catch((error: unknown) => {
    logger.error({ err: error }, "Demo seed failed");
    process.exitCode = 1;
  });
