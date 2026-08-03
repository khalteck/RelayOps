import { Schema, model, type Types } from "mongoose";

export interface RefreshSessionDocument {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<RefreshSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: Date,
    userAgent: String,
    ipAddress: String
  },
  { timestamps: true }
);

export const RefreshSessionModel = model<RefreshSessionDocument>(
  "RefreshSession",
  refreshSessionSchema
);
