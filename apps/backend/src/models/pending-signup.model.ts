import { Schema, model } from "mongoose";

export interface PendingSignupDocument {
  challengeId: string;
  name: string;
  email: string;
  passwordHash: string;
  codeHash: string;
  invalidAttempts: number;
  sendCount: number;
  codeExpiresAt: Date;
  resendAvailableAt: Date;
  purgeAt: Date;
  consumedAt?: Date;
  ipAddress?: string;
}

const pendingSignupSchema = new Schema<PendingSignupDocument>(
  {
    challengeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    codeHash: { type: String, required: true, select: false },
    invalidAttempts: { type: Number, default: 0 },
    sendCount: { type: Number, default: 1 },
    codeExpiresAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    purgeAt: { type: Date, required: true },
    consumedAt: Date,
    ipAddress: String
  },
  { timestamps: true }
);

pendingSignupSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
pendingSignupSchema.index({ email: 1, createdAt: -1 });

export const PendingSignupModel = model<PendingSignupDocument>(
  "PendingSignup",
  pendingSignupSchema
);
