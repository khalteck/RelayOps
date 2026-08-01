import type { SavedViewDefinition } from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

export interface SavedViewDocument {
  organisationId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  definition: SavedViewDefinition;
  createdAt: Date;
  updatedAt: Date;
}

const savedViewSchema = new Schema<SavedViewDocument>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    definition: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

savedViewSchema.index({ userId: 1, workspaceId: 1, name: 1 }, { unique: true });
savedViewSchema.index({ organisationId: 1, workspaceId: 1, userId: 1, updatedAt: -1 });

export const SavedViewModel = model<SavedViewDocument>("SavedView", savedViewSchema);
