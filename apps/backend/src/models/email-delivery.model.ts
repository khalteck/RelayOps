import { Schema, model } from "mongoose";

export type EmailDeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "bounced";

export interface EmailDeliveryDocument {
  kind: "verification" | "invitation" | "suspended" | "restored" | "removed";
  recipient: string;
  encryptedPayload: string;
  idempotencyKey: string;
  providerId?: string;
  status: EmailDeliveryStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastErrorCode?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailDeliverySchema = new Schema<EmailDeliveryDocument>(
  {
    kind: { type: String, required: true },
    recipient: { type: String, required: true, lowercase: true },
    encryptedPayload: { type: String, required: true, select: false },
    idempotencyKey: { type: String, required: true, unique: true },
    providerId: { type: String, index: true },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "bounced"],
      default: "queued"
    },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lastErrorCode: String,
    deliveredAt: Date
  },
  { timestamps: true }
);

emailDeliverySchema.index({ status: 1, nextAttemptAt: 1 });

export const EmailDeliveryModel = model<EmailDeliveryDocument>(
  "EmailDelivery",
  emailDeliverySchema
);
