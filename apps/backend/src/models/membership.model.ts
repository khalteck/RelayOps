import { ROLES, type Role } from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

export interface MembershipDocument {
  userId: Types.ObjectId;
  organisationId: Types.ObjectId;
  role: Role;
  workspaceIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<MembershipDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    role: { type: String, enum: ROLES, required: true },
    workspaceIds: [{ type: Schema.Types.ObjectId, ref: "Workspace" }]
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, organisationId: 1 }, { unique: true });
membershipSchema.index({ organisationId: 1, role: 1 });

export const MembershipModel = model<MembershipDocument>("Membership", membershipSchema);
