import type { IncidentDto, IncidentStatus, TimelineEntryDto } from "@relayops/types";
import mongoose from "mongoose";
import { logger } from "../../core/logger.js";
import { notifyIncidentParticipants } from "../notifications/notification.service.js";
import { requireWorkspaceAccess } from "../tenants/tenant.authorization.js";
import { appendIncidentActivity, incidentForMutation } from "./incident.persistence.js";
import { publishIncidentResult } from "./incident.result.js";
import {
  requireIncidentComment,
  requireIncidentMutation,
  requireTransition
} from "./incident.rules.js";

export async function transitionIncident(
  userId: string,
  workspaceId: string,
  incidentId: string,
  status: IncidentStatus,
  requestId?: string
): Promise<IncidentDto> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  const session = await mongoose.startSession();
  let timelineId = "";
  try {
    await session.withTransaction(async () => {
      const incident = await incidentForMutation(tenant, incidentId, session);
      requireIncidentMutation(
        tenant,
        incident.assigneeId ? String(incident.assigneeId) : undefined
      );
      requireTransition(incident.status, status, tenant.role);
      const previousStatus = incident.status;
      const now = new Date();
      incident.status = status;
      if (status === "acknowledged" && !incident.sla.acknowledgedAt) {
        incident.sla.acknowledgedAt = now;
      }
      if (status === "resolved" && !incident.sla.resolvedAt) {
        incident.sla.resolvedAt = now;
      }
      incident.revision += 1;
      await incident.save({ session });
      const timeline = await appendIncidentActivity({
        session,
        tenant,
        incidentId: incident._id,
        actorId: userId,
        kind: "status_changed",
        action:
          status === "investigating" && previousStatus === "resolved"
            ? "incident.reopened"
            : "incident.transitioned",
        ...(requestId ? { requestId } : {}),
        metadata: { previousStatus, status }
      });
      timelineId = String(timeline._id);
    });
  } finally {
    await session.endSession();
  }
  if (!timelineId) throw new Error("Status transaction did not commit");
  const result = await publishIncidentResult(incidentId, timelineId, "incident.updated");
  void notifyIncidentParticipants(result.incident, userId, "incident_updated").catch(
    (error: unknown) => logger.warn({ err: error, incidentId }, "Incident notification failed")
  );
  return result.incident;
}

export async function commentOnIncident(
  userId: string,
  workspaceId: string,
  incidentId: string,
  body: string,
  requestId?: string
): Promise<{ incident: IncidentDto; timeline: TimelineEntryDto }> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  const session = await mongoose.startSession();
  let timelineId = "";
  try {
    await session.withTransaction(async () => {
      const incident = await incidentForMutation(tenant, incidentId, session);
      requireIncidentComment(tenant, incident.assigneeId ? String(incident.assigneeId) : undefined);
      incident.revision += 1;
      await incident.save({ session });
      const timeline = await appendIncidentActivity({
        session,
        tenant,
        incidentId: incident._id,
        actorId: userId,
        kind: "comment",
        action: "incident.commented",
        ...(requestId ? { requestId } : {}),
        body,
        metadata: { revision: incident.revision }
      });
      timelineId = String(timeline._id);
    });
  } finally {
    await session.endSession();
  }
  if (!timelineId) throw new Error("Comment transaction did not commit");
  const result = await publishIncidentResult(incidentId, timelineId, "incident.updated");
  void notifyIncidentParticipants(result.incident, userId, "incident_commented").catch(
    (error: unknown) => logger.warn({ err: error, incidentId }, "Incident notification failed")
  );
  return result;
}
