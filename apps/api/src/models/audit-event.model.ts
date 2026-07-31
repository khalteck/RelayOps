import { Schema, model, type Types } from "mongoose";

export interface AuditEventDocument {
  organisationId: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  requestId?: string;
  createdAt: Date;
}

const auditEventSchema = new Schema<AuditEventDocument>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, maxlength: 120 },
    entityType: { type: String, required: true, maxlength: 80 },
    entityId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed },
    requestId: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditEventSchema.index({ organisationId: 1, workspaceId: 1, createdAt: -1 });
auditEventSchema.index({ organisationId: 1, actorId: 1, action: 1 });

export const AuditEventModel = model<AuditEventDocument>("AuditEvent", auditEventSchema);
