import type { ApiResponse, IncidentDto } from "@relayops/types";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";

export interface IncidentCacheSnapshot {
  detail: ApiResponse<IncidentDto> | undefined;
  lists: Array<[readonly unknown[], ApiResponse<IncidentDto[]> | undefined]>;
}

export async function snapshotIncidentCache(
  client: QueryClient,
  workspaceId: string,
  incidentId: string
): Promise<IncidentCacheSnapshot> {
  await client.cancelQueries({ queryKey: queryKeys.incidents.all(workspaceId) });
  return {
    detail: client.getQueryData(queryKeys.incidents.detail(workspaceId, incidentId)),
    lists: client.getQueriesData<ApiResponse<IncidentDto[]>>({
      queryKey: queryKeys.incidents.lists(workspaceId)
    })
  };
}

export function updateIncidentCache(
  client: QueryClient,
  workspaceId: string,
  incidentId: string,
  update: (incident: IncidentDto) => IncidentDto
): void {
  client.setQueryData<ApiResponse<IncidentDto>>(
    queryKeys.incidents.detail(workspaceId, incidentId),
    (current) => (current ? { ...current, data: update(current.data) } : current)
  );
  client.setQueriesData<ApiResponse<IncidentDto[]>>(
    { queryKey: queryKeys.incidents.lists(workspaceId) },
    (current) =>
      current
        ? {
            ...current,
            data: current.data.map((incident) =>
              incident.id === incidentId ? update(incident) : incident
            )
          }
        : current
  );
}

export function reconcileIncident(
  client: QueryClient,
  workspaceId: string,
  incident: IncidentDto
): void {
  updateIncidentCache(client, workspaceId, incident.id, (current) =>
    current.revision > incident.revision ? current : incident
  );
}

export function restoreIncidentCache(client: QueryClient, snapshot?: IncidentCacheSnapshot): void {
  if (!snapshot) return;
  for (const [key, value] of snapshot.lists) client.setQueryData(key, value);
  if (snapshot.detail) {
    const incident = snapshot.detail.data;
    client.setQueryData(
      queryKeys.incidents.detail(incident.workspaceId, incident.id),
      snapshot.detail
    );
  }
}
