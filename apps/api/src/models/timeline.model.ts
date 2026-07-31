import { TIMELINE_KINDS, type TimelineKind } from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

export interface TimelineDocument {
  organisationId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  incidentId: Types.ObjectId;
  actorId: Types.ObjectId;
  kind: TimelineKind;
  body?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const timelineSchema = new Schema<TimelineDocument>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: TIMELINE_KINDS, required: true },
    body: { type: String, maxlength: 4_000 },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

timelineSchema.index({ workspaceId: 1, incidentId: 1, createdAt: -1 });

export const TimelineModel = model<TimelineDocument>("TimelineEntry", timelineSchema);
