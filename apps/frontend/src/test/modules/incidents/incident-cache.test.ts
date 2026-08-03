import type { ApiResponse, IncidentDto } from "@relayops/types";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { queryKeys } from "@/helpers/query-keys";
import {
  restoreIncidentCache,
  snapshotIncidentCache,
  updateIncidentCache
} from "@/modules/incidents/operations/incident-cache";

const incident: IncidentDto = {
  id: "incident-1",
  organisationId: "org-1",
  workspaceId: "workspace-1",
  title: "API latency",
  description: "The API is responding slowly.",
  affectedService: "Platform API",
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
    resolveDueAt: "2026-08-01T11:00:00.000Z"
  },
  revision: 1,
  reportedAt: "2026-08-01T10:00:00.000Z",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z"
};

describe("optimistic incident cache", () => {
  it("restores both list and detail data after a failed mutation", async () => {
    const client = new QueryClient();
    const listKey = queryKeys.incidents.list("workspace-1", {});
    const detailKey = queryKeys.incidents.detail("workspace-1", "incident-1");
    client.setQueryData<ApiResponse<IncidentDto[]>>(listKey, { data: [incident] });
    client.setQueryData<ApiResponse<IncidentDto>>(detailKey, { data: incident });
    const snapshot = await snapshotIncidentCache(client, "workspace-1", "incident-1");

    updateIncidentCache(client, "workspace-1", "incident-1", (current) => ({
      ...current,
      status: "acknowledged",
      revision: 2
    }));
    expect(client.getQueryData<ApiResponse<IncidentDto>>(detailKey)?.data.status).toBe(
      "acknowledged"
    );

    restoreIncidentCache(client, snapshot);
    expect(client.getQueryData<ApiResponse<IncidentDto>>(detailKey)?.data.status).toBe("reported");
    expect(client.getQueryData<ApiResponse<IncidentDto[]>>(listKey)?.data[0]?.revision).toBe(1);
  });
});
