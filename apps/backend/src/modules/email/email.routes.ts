import express, { Router, type Router as ExpressRouter } from "express";
import { Resend } from "resend";
import { getEnv } from "../../config/env.js";
import { AppError } from "../../core/errors.js";
import { updateDelivery } from "./email.service.js";

export const emailWebhookRouter: ExpressRouter = Router();

emailWebhookRouter.post(
  "/resend",
  express.raw({ type: "application/json", limit: "256kb" }),
  async (request, response) => {
    const secret = getEnv().RESEND_WEBHOOK_SECRET;
    if (!secret || !Buffer.isBuffer(request.body))
      throw new AppError(400, "VALIDATION_ERROR", "Invalid webhook request");
    try {
      const event = new Resend(getEnv().RESEND_API_KEY).webhooks.verify({
        payload: request.body.toString("utf8"),
        headers: {
          id: request.get("svix-id") ?? "",
          timestamp: request.get("svix-timestamp") ?? "",
          signature: request.get("svix-signature") ?? ""
        },
        webhookSecret: secret
      }) as { type: string; data?: { email_id?: string } };
      const providerId = event.data?.email_id;
      const statuses = {
        "email.sent": "sent",
        "email.delivered": "delivered",
        "email.bounced": "bounced",
        "email.failed": "failed"
      } as const;
      const status = statuses[event.type as keyof typeof statuses];
      if (providerId && status) await updateDelivery(providerId, status);
      response.status(204).send();
    } catch {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid webhook request");
    }
  }
);
