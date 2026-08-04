import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import type { EmailPayload } from "./email.types.js";

function EmailDocument({ payload }: { payload: EmailPayload }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#f6f5f2",
          color: "#24232d",
          fontFamily: "Arial,sans-serif"
        }}
      >
        <div style={{ maxWidth: 560, margin: "32px auto", padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 24 }}>● ● ● RelayOps</div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #dedce6",
              borderRadius: 18,
              padding: 32
            }}
          >
            <p style={{ color: "#6258e8", fontWeight: 700, letterSpacing: 1 }}>
              OPERATIONAL CLARITY
            </p>
            <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>{payload.title}</h1>
            <p>Hello {payload.recipientName},</p>
            <p style={{ lineHeight: 1.65, color: "#5c5968" }}>{payload.intro}</p>
            {payload.code ? (
              <div
                style={{
                  margin: "24px 0",
                  padding: 18,
                  borderRadius: 12,
                  background: "#f0efff",
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: 8,
                  textAlign: "center"
                }}
              >
                {payload.code}
              </div>
            ) : null}
            {payload.actionUrl && payload.actionLabel ? (
              <a
                href={payload.actionUrl}
                style={{
                  display: "inline-block",
                  margin: "20px 0",
                  padding: "13px 20px",
                  borderRadius: 10,
                  background: "#5b55df",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700
                }}
              >
                {payload.actionLabel}
              </a>
            ) : null}
            {payload.detail ? (
              <p style={{ fontSize: 13, color: "#777382" }}>{payload.detail}</p>
            ) : null}
          </div>
          <p style={{ color: "#777382", fontSize: 12, lineHeight: 1.5 }}>
            This mandatory account message was sent by RelayOps. Never share verification codes or
            invitation links.
          </p>
        </div>
      </body>
    </html>
  );
}

export function renderEmail(payload: EmailPayload): { html: string; text: string } {
  const text = [
    payload.title,
    `Hello ${payload.recipientName},`,
    payload.intro,
    payload.code,
    payload.actionUrl,
    payload.detail
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    html: `<!doctype html>${renderToStaticMarkup(React.createElement(EmailDocument, { payload }))}`,
    text
  };
}
