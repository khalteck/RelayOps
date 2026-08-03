import { DEFAULT_SLA_POLICY, type SlaPolicy } from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

export interface WorkspaceDocument {
  organisationId: Types.ObjectId;
  name: string;
  slug: string;
  slaPolicy: SlaPolicy;
  createdAt: Date;
  updatedAt: Date;
}

const slaTargetSchema = new Schema(
  {
    acknowledgeMinutes: { type: Number, required: true, min: 1 },
    resolveMinutes: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const workspaceSchema = new Schema<WorkspaceDocument>(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    slaPolicy: {
      type: new Schema(
        {
          P1: { type: slaTargetSchema, required: true },
          P2: { type: slaTargetSchema, required: true },
          P3: { type: slaTargetSchema, required: true },
          P4: { type: slaTargetSchema, required: true }
        },
        { _id: false }
      ),
      required: true,
      default: () => structuredClone(DEFAULT_SLA_POLICY)
    }
  },
  { timestamps: true }
);

workspaceSchema.index({ organisationId: 1, slug: 1 }, { unique: true });

export const WorkspaceModel = model<WorkspaceDocument>("Workspace", workspaceSchema);
