import type { IncidentDto } from "@relayops/types";
import { describe, expect, it } from "vitest";
import { incidentSlaState } from "./sla-state";

function incident(overrides: Partial<IncidentDto["sla"]> = {}): IncidentDto {
  return {
    id: "incident-1",
    organisationId: "org-1",
    workspaceId: "workspace-1",
    title: "Checkout latency",
    description: "Checkout requests are responding slowly.",
    affectedService: "Checkout API",
    status: "reported",
    priority: "P1",
    severity: "SEV1",
    reporter: { id: "user-1", name: "Olivia", email: "olivia@example.com" },
    assignee: null,
    sla: {
      sourcePriority: "P1",
      acknowledgeTargetMinutes: 5,
      resolveTargetMinutes: 60,
      acknowledgeDueAt: "2026-08-01T10:05:00.000Z",
      resolveDueAt: "2026-08-01T11:00:00.000Z",
      ...overrides
    },
    revision: 1,
    reportedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z"
  };
}

describe("SLA presentation boundaries", () => {
  it("marks an active target at exactly twenty percent as at risk", () => {
    expect(incidentSlaState(incident(), "2026-08-01T10:04:00.000Z").state).toBe("at-risk");
  });

  it("marks overdue active targets as breached", () => {
    expect(incidentSlaState(incident(), "2026-08-01T10:06:00.000Z").state).toBe("breached");
  });

  it("freezes a completed result against its deadline", () => {
    const completed = incident({
      acknowledgedAt: "2026-08-01T10:03:00.000Z",
      resolvedAt: "2026-08-01T10:55:00.000Z"
    });
    expect(incidentSlaState(completed, "2026-08-03T10:00:00.000Z").state).toBe("met");
  });
});
