import { describe, expect, it } from "vitest";
import { acceptInvitationInputSchema, inviteMemberInputSchema } from "./account-contracts.js";
import { registerStartInputSchema } from "./contracts.js";

describe("member invitation contract", () => {
  it("accepts a scoped operational role", () => {
    expect(
      inviteMemberInputSchema.parse({
        email: "RESPONDER@EXAMPLE.COM",
        role: "responder",
        workspaceIds: ["workspace-1"]
      })
    ).toMatchObject({ email: "responder@example.com", role: "responder" });
  });

  it("does not allow owner elevation through an invitation", () => {
    expect(() =>
      inviteMemberInputSchema.parse({
        email: "owner@example.com",
        role: "owner",
        workspaceIds: ["workspace-1"]
      })
    ).toThrow();
  });

  it("explains the missing password requirement precisely", () => {
    const result = registerStartInputSchema.safeParse({
      name: "Relay Owner",
      email: "owner@example.com",
      password: "too-short"
    });

    expect(result.error?.issues[0]?.message).toBe("Password must be at least 12 characters.");
  });

  it("uses the same password policy for invited accounts", () => {
    const result = acceptInvitationInputSchema.safeParse({
      name: "Invited User",
      password: "too-short"
    });

    expect(result.error?.issues[0]?.message).toBe("Password must be at least 12 characters.");
  });
});
