import {
  DEFAULT_SLA_POLICY,
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentStatus
} from "@relayops/types";
import type { Types } from "mongoose";
import { AuditEventModel } from "../../models/audit-event.model.js";
import { IncidentModel } from "../../models/incident.model.js";
import { TimelineModel } from "../../models/timeline.model.js";
import { DEMO_INCIDENT_SUMMARIES, DEMO_SERVICES, DEMO_USERS } from "./definitions.js";
import type { SeedContext } from "./tenants.js";

const DAY = 86_400_000;
const MINUTE = 60_000;

interface SeedTimelineEntry {
  key: string;
  kind: "incident_created" | "status_changed" | "comment";
  createdAt: Date;
  metadata: Record<string, unknown>;
  body?: string;
}

function statusAt(index: number): IncidentStatus {
  if (index === 0 || index === 1) return "reported";
  return INCIDENT_STATUSES[index % INCIDENT_STATUSES.length]!;
}

function reportedAt(index: number, now: number): Date {
  if (index === 0) return new Date(now - 4 * MINUTE);
  if (index === 1) return new Date(now - 8 * MINUTE);
  return new Date(now - (index % 90) * DAY - (index % 18) * 3_600_000);
}

async function seedActivity({
  incidentId,
  organisationId,
  workspaceId,
  actorId,
  status,
  startedAt,
  seedKey
}: {
  incidentId: unknown;
  organisationId: unknown;
  workspaceId: unknown;
  actorId: unknown;
  status: IncidentStatus;
  startedAt: Date;
  seedKey: string;
}) {
  const statuses = INCIDENT_STATUSES.slice(0, INCIDENT_STATUSES.indexOf(status) + 1);
  const entries: SeedTimelineEntry[] = [
    {
      key: `${seedKey}:created`,
      kind: "incident_created" as const,
      createdAt: startedAt,
      metadata: { seeded: true, seedKey: `${seedKey}:created` }
    },
    ...statuses.slice(1).map((nextStatus, activityIndex) => ({
      key: `${seedKey}:status:${nextStatus}`,
      kind: "status_changed" as const,
      createdAt: new Date(startedAt.getTime() + (activityIndex + 1) * 18 * MINUTE),
      metadata: {
        seeded: true,
        seedKey: `${seedKey}:status:${nextStatus}`,
        to: nextStatus
      }
    }))
  ];
  if (Number(seedKey.split(":").at(-1)) % 3 === 0) {
    entries.push({
      key: `${seedKey}:comment`,
      kind: "comment",
      createdAt: new Date(startedAt.getTime() + 11 * MINUTE),
      metadata: { seeded: true, seedKey: `${seedKey}:comment` },
      body: "Responder context captured during the demo incident review."
    });
  }
  for (const entry of entries) {
    const { key, ...activity } = entry;
    await TimelineModel.findOneAndUpdate(
      { incidentId, "metadata.seedKey": key },
      { $set: { ...activity, organisationId, workspaceId, incidentId, actorId } },
      { upsert: true, new: true, timestamps: false }
    );
  }
}

export async function seedIncidentHistory(context: SeedContext): Promise<number> {
  const now = Date.now();
  let created = 0;
  for (let index = 0; index < 96; index += 1) {
    const workspace = context.workspaces[index % context.workspaces.length]!;
    const priority = INCIDENT_PRIORITIES[index % INCIDENT_PRIORITIES.length]!;
    const severity = INCIDENT_SEVERITIES[(index * 3) % INCIDENT_SEVERITIES.length]!;
    const service = DEMO_SERVICES[index % DEMO_SERVICES.length]!;
    const status = statusAt(index);
    const startedAt = reportedAt(index, now);
    const target = DEFAULT_SLA_POLICY[priority];
    const reporterId = context.users.get(DEMO_USERS[index % DEMO_USERS.length]!.email)!;
    const assigneeId =
      status === "reported" ? undefined : context.users.get("responder@relayops.demo");
    const acknowledgeMinutes = Math.max(
      1,
      Math.round(target.acknowledgeMinutes * (index % 4 ? 0.6 : 1.3))
    );
    const resolveMinutes = Math.max(2, Math.round(target.resolveMinutes * (index % 3 ? 0.7 : 1.2)));
    const seedKey = `relayops-demo:${index}`;
    const title = `[Demo ${String(index + 1).padStart(3, "0")}] ${service}: ${DEMO_INCIDENT_SUMMARIES[index % DEMO_INCIDENT_SUMMARIES.length]}`;
    const incidentValues = {
      organisationId: workspace.organisationId,
      workspaceId: workspace.workspaceId,
      title,
      description: `${service} generated a deterministic operational signal for the RelayOps portfolio history.`,
      affectedService: service,
      priority,
      severity,
      status,
      reporterId,
      ...(assigneeId ? { assigneeId: assigneeId as Types.ObjectId } : {}),
      sla: {
        sourcePriority: priority,
        acknowledgeTargetMinutes: target.acknowledgeMinutes,
        resolveTargetMinutes: target.resolveMinutes,
        acknowledgeDueAt: new Date(startedAt.getTime() + target.acknowledgeMinutes * MINUTE),
        resolveDueAt: new Date(startedAt.getTime() + target.resolveMinutes * MINUTE),
        ...(status !== "reported"
          ? { acknowledgedAt: new Date(startedAt.getTime() + acknowledgeMinutes * MINUTE) }
          : {}),
        ...(status === "resolved"
          ? { resolvedAt: new Date(startedAt.getTime() + resolveMinutes * MINUTE) }
          : {})
      },
      revision: Math.max(1, INCIDENT_STATUSES.indexOf(status) + 1),
      reportedAt: startedAt,
      createdAt: startedAt,
      updatedAt:
        status === "resolved" ? new Date(startedAt.getTime() + resolveMinutes * MINUTE) : startedAt
    };
    const incident = await IncidentModel.findOneAndUpdate(
      { organisationId: workspace.organisationId, workspaceId: workspace.workspaceId, title },
      {
        $set: incidentValues,
        ...(assigneeId ? {} : { $unset: { assigneeId: 1 } })
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, timestamps: false }
    );
    await seedActivity({
      incidentId: incident._id,
      organisationId: workspace.organisationId,
      workspaceId: workspace.workspaceId,
      actorId: reporterId,
      status,
      startedAt,
      seedKey
    });
    await AuditEventModel.findOneAndUpdate(
      { entityId: incident._id, action: "incident.created", "metadata.seedKey": seedKey },
      {
        $set: {
          organisationId: workspace.organisationId,
          workspaceId: workspace.workspaceId,
          actorId: reporterId,
          action: "incident.created",
          entityType: "incident",
          entityId: incident._id,
          metadata: { seeded: true, seedKey },
          createdAt: startedAt
        }
      },
      { upsert: true, new: true, timestamps: false }
    );
    created += 1;
  }
  return created;
}
