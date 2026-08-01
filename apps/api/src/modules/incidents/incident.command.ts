import type { ClassifyIncidentInput, CreateIncidentInput, IncidentDto } from "@relayops/types";
import mongoose, { Types, type ClientSession } from "mongoose";
import { AppError } from "../../core/errors.js";
import { logger } from "../../core/logger.js";
import { IncidentModel } from "../../models/incident.model.js";
import { MembershipModel } from "../../models/membership.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { requireWorkspaceAccess } from "../tenants/tenant.authorization.js";
import { notifyIncidentParticipants } from "../notifications/notification.service.js";
import { appendIncidentActivity, incidentForMutation } from "./incident.persistence.js";
import { publishIncidentResult } from "./incident.result.js";
import { requireIncidentMutation, slaSnapshot } from "./incident.rules.js";

async function requireEligibleAssignee(
  organisationId: string,
  workspaceId: string,
  assigneeId: string,
  session?: ClientSession
): Promise<void> {
  if (!Types.ObjectId.isValid(assigneeId)) {
    throw new AppError(400, "VALIDATION_ERROR", "Assignee is invalid");
  }
  const membership = await MembershipModel.findOne({
    organisationId,
    userId: assigneeId,
    role: { $ne: "viewer" },
    $or: [{ role: { $in: ["owner", "administrator"] } }, { workspaceIds: workspaceId }]
  })
    .session(session ?? null)
    .lean();
  if (!membership)
    throw new AppError(400, "VALIDATION_ERROR", "Assignee is not an operational member");
}

export async function createIncident(
  userId: string,
  workspaceId: string,
  input: CreateIncidentInput,
  requestId?: string
): Promise<IncidentDto> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId, "incident:create");
  const workspace = await WorkspaceModel.findById(workspaceId).lean();
  if (!workspace) throw new AppError(404, "NOT_FOUND", "Workspace not found");

  const assigneeId = tenant.role === "responder" ? userId : (input.assigneeId ?? undefined);
  if (assigneeId) {
    await requireEligibleAssignee(tenant.organisationId, workspaceId, assigneeId);
  }
  const reportedAt = new Date();
  const session = await mongoose.startSession();
  let incidentId = "";
  let timelineId = "";
  try {
    await session.withTransaction(async () => {
      const [incident] = await IncidentModel.create(
        [
          {
            organisationId: tenant.organisationId,
            workspaceId,
            title: input.title,
            description: input.description,
            affectedService: input.affectedService,
            priority: input.priority,
            severity: input.severity,
            reporterId: userId,
            ...(assigneeId ? { assigneeId } : {}),
            status: "reported",
            reportedAt,
            sla: slaSnapshot(workspace.slaPolicy, input.priority, reportedAt),
            revision: 1
          }
        ],
        { session }
      );
      if (!incident) throw new Error("Incident creation failed");
      const timeline = await appendIncidentActivity({
        session,
        tenant,
        incidentId: incident._id,
        actorId: userId,
        kind: "incident_created",
        action: "incident.created",
        ...(requestId ? { requestId } : {}),
        metadata: {
          priority: input.priority,
          severity: input.severity,
          assigneeId: assigneeId ?? null
        }
      });
      incidentId = String(incident._id);
      timelineId = String(timeline._id);
    });
  } finally {
    await session.endSession();
  }
  if (!incidentId || !timelineId) throw new Error("Incident transaction did not commit");
  const result = await publishIncidentResult(incidentId, timelineId, "incident.created");
  if (assigneeId) {
    void notifyIncidentParticipants(result.incident, userId, "incident_assigned", [
      assigneeId
    ]).catch((error: unknown) =>
      logger.warn({ err: error, incidentId }, "Incident notification failed")
    );
  }
  return result.incident;
}

async function assignmentMutation(
  userId: string,
  workspaceId: string,
  incidentId: string,
  assigneeId: string | null,
  requestId: string | undefined,
  claim: boolean
): Promise<IncidentDto> {
  const tenant = await requireWorkspaceAccess(
    userId,
    workspaceId,
    claim ? "incident:claim" : "incident:assign"
  );
  const session = await mongoose.startSession();
  let timelineId = "";
  try {
    await session.withTransaction(async () => {
      const incident = await incidentForMutation(tenant, incidentId, session);
      if (claim && incident.assigneeId) {
        throw new AppError(409, "CONFLICT", "Incident is already assigned");
      }
      if (assigneeId) {
        await requireEligibleAssignee(tenant.organisationId, workspaceId, assigneeId, session);
      }
      const previousAssigneeId = incident.assigneeId ? String(incident.assigneeId) : null;
      if (assigneeId) incident.assigneeId = new Types.ObjectId(assigneeId);
      else incident.set("assigneeId", undefined);
      incident.revision += 1;
      await incident.save({ session });
      const timeline = await appendIncidentActivity({
        session,
        tenant,
        incidentId: incident._id,
        actorId: userId,
        kind: "assignment_changed",
        action: claim ? "incident.claimed" : "incident.assigned",
        ...(requestId ? { requestId } : {}),
        metadata: { previousAssigneeId, assigneeId }
      });
      timelineId = String(timeline._id);
    });
  } finally {
    await session.endSession();
  }
  if (!timelineId) throw new Error("Assignment transaction did not commit");
  const result = await publishIncidentResult(incidentId, timelineId, "incident.updated");
  if (assigneeId) {
    void notifyIncidentParticipants(result.incident, userId, "incident_assigned", [
      assigneeId
    ]).catch((error: unknown) =>
      logger.warn({ err: error, incidentId }, "Incident notification failed")
    );
  }
  return result.incident;
}

export function claimIncident(
  userId: string,
  workspaceId: string,
  incidentId: string,
  requestId?: string
) {
  return assignmentMutation(userId, workspaceId, incidentId, userId, requestId, true);
}

export function assignIncident(
  userId: string,
  workspaceId: string,
  incidentId: string,
  assigneeId: string | null,
  requestId?: string
) {
  return assignmentMutation(userId, workspaceId, incidentId, assigneeId, requestId, false);
}

export async function classifyIncident(
  userId: string,
  workspaceId: string,
  incidentId: string,
  input: ClassifyIncidentInput,
  requestId?: string
): Promise<IncidentDto> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  const workspace = await WorkspaceModel.findById(workspaceId).lean();
  if (!workspace) throw new AppError(404, "NOT_FOUND", "Workspace not found");
  const session = await mongoose.startSession();
  let timelineId = "";
  try {
    await session.withTransaction(async () => {
      const incident = await incidentForMutation(tenant, incidentId, session);
      requireIncidentMutation(
        tenant,
        incident.assigneeId ? String(incident.assigneeId) : undefined
      );
      const previous = { priority: incident.priority, severity: incident.severity };
      const priorityChanged = Boolean(input.priority && input.priority !== incident.priority);
      if (input.priority && input.priority !== incident.priority) {
        const snapshot = slaSnapshot(workspace.slaPolicy, input.priority, incident.reportedAt);
        incident.priority = input.priority;
        incident.sla.sourcePriority = input.priority;
        if (!incident.sla.acknowledgedAt) {
          incident.sla.acknowledgeTargetMinutes = snapshot.acknowledgeTargetMinutes;
          incident.sla.acknowledgeDueAt = snapshot.acknowledgeDueAt;
        }
        if (!incident.sla.resolvedAt) {
          incident.sla.resolveTargetMinutes = snapshot.resolveTargetMinutes;
          incident.sla.resolveDueAt = snapshot.resolveDueAt;
        }
      }
      if (input.severity) incident.severity = input.severity;
      incident.revision += 1;
      await incident.save({ session });
      const timeline = await appendIncidentActivity({
        session,
        tenant,
        incidentId: incident._id,
        actorId: userId,
        kind: "classification_changed",
        action: "incident.classified",
        ...(requestId ? { requestId } : {}),
        metadata: {
          previous,
          current: { priority: incident.priority, severity: incident.severity }
        }
      });
      timelineId = String(timeline._id);
      if (priorityChanged && (!incident.sla.acknowledgedAt || !incident.sla.resolvedAt)) {
        const slaTimeline = await appendIncidentActivity({
          session,
          tenant,
          incidentId: incident._id,
          actorId: userId,
          kind: "sla_changed",
          action: "incident.sla_recalculated",
          ...(requestId ? { requestId } : {}),
          metadata: {
            sourcePriority: incident.sla.sourcePriority,
            acknowledgeDueAt: incident.sla.acknowledgeDueAt.toISOString(),
            resolveDueAt: incident.sla.resolveDueAt.toISOString()
          }
        });
        timelineId = String(slaTimeline._id);
      }
    });
  } finally {
    await session.endSession();
  }
  if (!timelineId) throw new Error("Classification transaction did not commit");
  return (await publishIncidentResult(incidentId, timelineId, "incident.updated")).incident;
}
