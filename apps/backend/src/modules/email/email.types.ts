export type EmailKind = "verification" | "invitation" | "suspended" | "restored" | "removed";

export interface EmailPayload {
  recipientName: string;
  title: string;
  intro: string;
  actionLabel?: string;
  actionUrl?: string;
  code?: string;
  detail?: string;
}

export interface EmailTransport {
  send(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
    idempotencyKey: string;
  }): Promise<{ id: string }>;
}
