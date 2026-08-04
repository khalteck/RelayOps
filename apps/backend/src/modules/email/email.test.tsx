import { describe, expect, it } from "vitest";
import { decryptEmailPayload, encryptEmailPayload } from "./email.crypto.js";
import { renderEmail } from "./email-template.js";

describe("email infrastructure", () => {
  it("encrypts sensitive template values at rest", () => {
    const payload = { recipientName: "Olivia", title: "Verify", intro: "Continue", code: "123456" };
    const encrypted = encryptEmailPayload(payload);
    expect(encrypted).not.toContain("123456");
    expect(decryptEmailPayload(encrypted)).toEqual(payload);
  });

  it("renders branded HTML and plain text without executable markup", () => {
    const rendered = renderEmail({
      recipientName: "<script>alert(1)</script>",
      title: "Welcome",
      intro: "Join RelayOps"
    });
    expect(rendered.html).toContain("RelayOps");
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
    expect(rendered.text).toContain("Join RelayOps");
  });
});
