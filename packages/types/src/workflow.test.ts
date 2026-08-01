import { describe, expect, it } from "vitest";
import { canTransitionStatus, hasPermission } from "./index.js";

describe("incident workflow", () => {
  it("enforces the strict sequence", () => {
    expect(canTransitionStatus("reported", "acknowledged", "responder")).toBe(true);
    expect(canTransitionStatus("reported", "investigating", "owner")).toBe(false);
  });

  it("reserves reopening for privileged roles", () => {
    expect(canTransitionStatus("resolved", "investigating", "administrator")).toBe(true);
    expect(canTransitionStatus("resolved", "investigating", "responder")).toBe(false);
  });
});

describe("role permissions", () => {
  it("keeps frontend and backend capability names aligned", () => {
    expect(hasPermission("owner", "organisation:update")).toBe(true);
    expect(hasPermission("administrator", "organisation:update")).toBe(false);
    expect(hasPermission("viewer", "incident:create")).toBe(false);
  });

  it("reserves organisation member management for owners", () => {
    expect(hasPermission("owner", "members:manage")).toBe(true);
    expect(hasPermission("administrator", "members:manage")).toBe(false);
  });
});
