import type { TimelineKind } from "@relayops/types";
import { Types, type ClientSession } from "mongoose";
import { AuditEventModel } from "../../models/audit-event.model.js";
import { IncidentModel } from "../../models/incident.model.js";
import { TimelineModel } from "../../models/timeline.model.js";
import { AppError } from "../../core/errors.js";
import type { WorkspaceTenantContext } from "../tenants/tenant.authorization.js";

interface ActivityInput {
  session: ClientSession;
  tenant: WorkspaceTenantContext;
  incidentId: Types.ObjectId;
  actorId: string;
  kind: TimelineKind;
  action: string;
  requestId?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export async function appendIncidentActivity(input: ActivityInput) {
  const [timeline] = await TimelineModel.create(
    [
      {
        organisationId: input.tenant.organisationId,
        workspaceId: input.tenant.workspaceId,
        incidentId: input.incidentId,
        actorId: input.actorId,
        kind: input.kind,
        ...(input.body ? { body: input.body } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {})
      }
    ],
    { session: input.session }
  );
  await AuditEventModel.create(
    [
      {
        organisationId: input.tenant.organisationId,
        workspaceId: input.tenant.workspaceId,
        actorId: input.actorId,
        action: input.action,
        entityType: "incident",
        entityId: input.incidentId,
        ...(input.metadata ? { metadata: input.metadata } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {})
      }
    ],
    { session: input.session }
  );
  if (!timeline) throw new Error("Timeline activity creation failed");
  return timeline;
}

export async function incidentForMutation(
  tenant: WorkspaceTenantContext,
  incidentId: string,
  session: ClientSession
) {
  if (!Types.ObjectId.isValid(incidentId)) {
    throw new AppError(404, "NOT_FOUND", "Incident not found");
  }
  const incident = await IncidentModel.findOne({
    _id: incidentId,
    organisationId: tenant.organisationId,
    workspaceId: tenant.workspaceId
  }).session(session);
  if (!incident) throw new AppError(404, "NOT_FOUND", "Incident not found");
  return incident;
}
