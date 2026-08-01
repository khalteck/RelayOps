import { ROLES, type Role } from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

export interface InvitationDocument {
  organisationId: Types.ObjectId;
  workspaceIds: Types.ObjectId[];
  invitedById: Types.ObjectId;
  email: string;
  role: Exclude<Role, "owner">;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<InvitationDocument>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    workspaceIds: [{ type: Schema.Types.ObjectId, ref: "Workspace", required: true }],
    invitedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ROLES.filter((role) => role !== "owner"), required: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date
  },
  { timestamps: true }
);

invitationSchema.index({ tokenHash: 1 }, { unique: true });
invitationSchema.index({ organisationId: 1, email: 1, createdAt: -1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const InvitationModel = model<InvitationDocument>("Invitation", invitationSchema);
