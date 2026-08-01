import {
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentPriority,
  type IncidentSeverity,
  type IncidentStatus
} from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

interface IncidentSla {
  sourcePriority: IncidentPriority;
  acknowledgeTargetMinutes: number;
  resolveTargetMinutes: number;
  acknowledgeDueAt: Date;
  resolveDueAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface IncidentDocument {
  organisationId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  description: string;
  affectedService: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  reporterId: Types.ObjectId;
  assigneeId?: Types.ObjectId;
  sla: IncidentSla;
  revision: number;
  reportedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IncidentDocument>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 10_000 },
    affectedService: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: INCIDENT_STATUSES, default: "reported", required: true },
    priority: { type: String, enum: INCIDENT_PRIORITIES, required: true },
    severity: { type: String, enum: INCIDENT_SEVERITIES, required: true },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
    sla: {
      sourcePriority: { type: String, enum: INCIDENT_PRIORITIES, required: true },
      acknowledgeTargetMinutes: { type: Number, required: true },
      resolveTargetMinutes: { type: Number, required: true },
      acknowledgeDueAt: { type: Date, required: true },
      resolveDueAt: { type: Date, required: true },
      acknowledgedAt: Date,
      resolvedAt: Date
    },
    revision: { type: Number, default: 1, required: true },
    reportedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

incidentSchema.index({ organisationId: 1, workspaceId: 1, createdAt: -1 });
incidentSchema.index({ workspaceId: 1, status: 1, priority: 1, assigneeId: 1 });
incidentSchema.index({ title: "text", description: "text", affectedService: "text" });

export const IncidentModel = model<IncidentDocument>("Incident", incidentSchema);
