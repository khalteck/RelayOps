import type { IncidentDto, PersonSummary, TimelineEntryDto } from "@relayops/types";
import type { Types } from "mongoose";
import type { IncidentDocument } from "../../models/incident.model.js";
import type { TimelineDocument } from "../../models/timeline.model.js";
import { UserModel } from "../../models/user.model.js";

type StoredIncident = IncidentDocument & { _id: unknown };
type StoredTimeline = TimelineDocument & { _id: unknown };

function person(user: { _id: unknown; name: string; email: string }): PersonSummary {
  return { id: String(user._id), name: user.name, email: user.email };
}

async function peopleById(ids: Types.ObjectId[]): Promise<Map<string, PersonSummary>> {
  const uniqueIds = [...new Set(ids.map(String))];
  const users = await UserModel.find({ _id: { $in: uniqueIds } })
    .select("name email")
    .lean();
  return new Map(users.map((user) => [String(user._id), person(user)]));
}

export async function incidentsDto(incidents: StoredIncident[]): Promise<IncidentDto[]> {
  const people = await peopleById(
    incidents.flatMap((incident) => [
      incident.reporterId,
      ...(incident.assigneeId ? [incident.assigneeId] : [])
    ])
  );

  return incidents.map((incident) => {
    const reporter = people.get(String(incident.reporterId));
    if (!reporter) throw new Error("Incident reporter is unavailable");
    const assignee = incident.assigneeId ? (people.get(String(incident.assigneeId)) ?? null) : null;

    return {
      id: String(incident._id),
      organisationId: String(incident.organisationId),
      workspaceId: String(incident.workspaceId),
      title: incident.title,
      description: incident.description,
      affectedService: incident.affectedService,
      status: incident.status,
      priority: incident.priority,
      severity: incident.severity,
      reporter,
      assignee,
      sla: {
        sourcePriority: incident.sla.sourcePriority,
        acknowledgeTargetMinutes: incident.sla.acknowledgeTargetMinutes,
        resolveTargetMinutes: incident.sla.resolveTargetMinutes,
        acknowledgeDueAt: incident.sla.acknowledgeDueAt.toISOString(),
        resolveDueAt: incident.sla.resolveDueAt.toISOString(),
        ...(incident.sla.acknowledgedAt
          ? { acknowledgedAt: incident.sla.acknowledgedAt.toISOString() }
          : {}),
        ...(incident.sla.resolvedAt ? { resolvedAt: incident.sla.resolvedAt.toISOString() } : {})
      },
      revision: incident.revision,
      reportedAt: incident.reportedAt.toISOString(),
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString()
    };
  });
}

export async function incidentDto(incident: StoredIncident): Promise<IncidentDto> {
  const [result] = await incidentsDto([incident]);
  if (!result) throw new Error("Incident mapping failed");
  return result;
}

export async function timelineEntriesDto(entries: StoredTimeline[]): Promise<TimelineEntryDto[]> {
  const people = await peopleById(entries.map((entry) => entry.actorId));
  return entries.map((entry) => {
    const actor = people.get(String(entry.actorId));
    if (!actor) throw new Error("Timeline actor is unavailable");
    return {
      id: String(entry._id),
      incidentId: String(entry.incidentId),
      actor,
      kind: entry.kind,
      ...(entry.body ? { body: entry.body } : {}),
      ...(entry.metadata ? { metadata: entry.metadata } : {}),
      createdAt: entry.createdAt.toISOString()
    };
  });
}

export async function timelineEntryDto(entry: StoredTimeline): Promise<TimelineEntryDto> {
  const [result] = await timelineEntriesDto([entry]);
  if (!result) throw new Error("Timeline mapping failed");
  return result;
}
