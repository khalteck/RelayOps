import { randomUUID } from "node:crypto";
import { EmailDeliveryModel, type EmailDeliveryStatus } from "../../models/email-delivery.model.js";
import { logger } from "../../core/logger.js";
import { decryptEmailPayload, encryptEmailPayload } from "./email.crypto.js";
import { renderEmail } from "./email-template.js";
import { emailTransport } from "./email.transport.js";
import type { EmailKind, EmailPayload } from "./email.types.js";

export async function queueEmail(input: {
  kind: EmailKind;
  to: string;
  payload: EmailPayload;
  idempotencyKey?: string;
}) {
  const delivery = await EmailDeliveryModel.create({
    kind: input.kind,
    recipient: input.to,
    encryptedPayload: encryptEmailPayload(input.payload),
    idempotencyKey: input.idempotencyKey ?? randomUUID(),
    status: "queued",
    nextAttemptAt: new Date()
  });
  await dispatchEmail(String(delivery._id));
  return EmailDeliveryModel.findById(delivery._id).lean();
}

export async function dispatchEmail(deliveryId: string): Promise<void> {
  const delivery = await EmailDeliveryModel.findById(deliveryId).select("+encryptedPayload");
  if (!delivery || ["sent", "delivered", "bounced"].includes(delivery.status)) return;
  try {
    const payload = decryptEmailPayload(delivery.encryptedPayload);
    const rendered = renderEmail(payload);
    const result = await emailTransport().send({
      to: delivery.recipient,
      subject: payload.title,
      ...rendered,
      idempotencyKey: delivery.idempotencyKey
    });
    delivery.status = "sent";
    delivery.providerId = result.id;
    delivery.attempts += 1;
    delivery.set("lastErrorCode", undefined);
  } catch (error) {
    delivery.attempts += 1;
    delivery.status = "failed";
    delivery.lastErrorCode = "EMAIL_SEND_FAILED";
    delivery.nextAttemptAt = new Date(
      Date.now() + Math.min(60_000 * 2 ** delivery.attempts, 3_600_000)
    );
    logger.warn(
      {
        deliveryId,
        kind: delivery.kind,
        failureType: error instanceof Error ? error.name : "UnknownError"
      },
      "Email delivery attempt failed"
    );
  }
  await delivery.save();
}

export async function retryQueuedEmails(): Promise<void> {
  const jobs = await EmailDeliveryModel.find({
    status: { $in: ["queued", "failed"] },
    nextAttemptAt: { $lte: new Date() },
    attempts: { $lt: 5 }
  })
    .limit(20)
    .lean();
  await Promise.all(jobs.map((job) => dispatchEmail(String(job._id))));
}

export async function updateDelivery(
  providerId: string,
  status: EmailDeliveryStatus
): Promise<void> {
  await EmailDeliveryModel.findOneAndUpdate(
    { providerId },
    { $set: { status, ...(status === "delivered" ? { deliveredAt: new Date() } : {}) } }
  );
}
