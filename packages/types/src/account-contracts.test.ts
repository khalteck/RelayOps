import { describe, expect, it } from "vitest";
import { inviteMemberInputSchema } from "./account-contracts.js";

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
});
