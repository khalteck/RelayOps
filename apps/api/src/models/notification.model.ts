import { NOTIFICATION_KINDS, type NotificationKind } from "@relayops/types";
import { Schema, model, type Types } from "mongoose";

export interface NotificationDocument {
  userId: Types.ObjectId;
  organisationId?: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  kind: NotificationKind;
  title: string;
  message: string;
  resourcePath?: string;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation" },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
    kind: { type: String, enum: NOTIFICATION_KINDS, required: true },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 1_000 },
    resourcePath: { type: String, maxlength: 500 },
    readAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });

export const NotificationModel = model<NotificationDocument>("Notification", notificationSchema);
