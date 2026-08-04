import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { getEnv } from "../../config/env.js";
import type { EmailTransport } from "./email.types.js";

export const capturedEmails: Array<{ to: string; subject: string; text: string; id: string }> = [];

class MemoryTransport implements EmailTransport {
  async send(input: Parameters<EmailTransport["send"]>[0]): Promise<{ id: string }> {
    const id = randomUUID();
    capturedEmails.push({ to: input.to, subject: input.subject, text: input.text, id });
    return { id };
  }
}

class ResendTransport implements EmailTransport {
  private readonly client: Resend;
  constructor() {
    const apiKey = getEnv().RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    this.client = new Resend(apiKey);
  }
  async send(input: Parameters<EmailTransport["send"]>[0]): Promise<{ id: string }> {
    const result = await this.client.emails.send(
      {
        from: getEnv().EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      },
      { idempotencyKey: input.idempotencyKey }
    );
    if (result.error || !result.data) throw new Error(result.error?.name ?? "EMAIL_PROVIDER_ERROR");
    return { id: result.data.id };
  }
}

let transport: EmailTransport | undefined;
export function emailTransport(): EmailTransport {
  transport ??=
    getEnv().EMAIL_PROVIDER === "resend" ? new ResendTransport() : new MemoryTransport();
  return transport;
}

export function setEmailTransportForTest(value?: EmailTransport): void {
  transport = value;
}
