import { DEFAULT_SLA_POLICY } from "@relayops/types";
import { describe, expect, it } from "vitest";
import { AppError } from "../../core/errors.js";
import {
  requireIncidentComment,
  requireIncidentMutation,
  requireTransition,
  slaSnapshot
} from "./incident.rules.js";

describe("incident authorization rules", () => {
  it("allows responders to change only their assigned incidents", () => {
    expect(() =>
      requireIncidentMutation({ userId: "responder-1", role: "responder" }, "responder-1")
    ).not.toThrow();
    expect(() =>
      requireIncidentMutation({ userId: "responder-1", role: "responder" }, "responder-2")
    ).toThrow(AppError);
  });

  it("keeps viewer comments read-only", () => {
    expect(() =>
      requireIncidentComment({ userId: "viewer-1", role: "viewer" }, "viewer-1")
    ).toThrowError(/only comment/i);
  });

  it("reserves reopening for owners and administrators", () => {
    expect(() => requireTransition("resolved", "investigating", "administrator")).not.toThrow();
    expect(() => requireTransition("resolved", "investigating", "responder")).toThrowError(
      /cannot move/i
    );
  });
});

describe("SLA snapshots", () => {
  it("uses the workspace policy and reported time", () => {
    const reportedAt = new Date("2026-08-01T10:00:00.000Z");
    const snapshot = slaSnapshot(DEFAULT_SLA_POLICY, "P1", reportedAt);
    expect(snapshot.acknowledgeDueAt.toISOString()).toBe("2026-08-01T10:05:00.000Z");
    expect(snapshot.resolveDueAt.toISOString()).toBe("2026-08-01T11:00:00.000Z");
  });
});
