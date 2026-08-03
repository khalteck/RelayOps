import type {
  ApiResponse,
  IncidentDto,
  IncidentFilters,
  TimelineEntryDto,
  WorkspaceMember
} from "@relayops/types";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";
import { incidentApiQuery, normalizeIncidentFilters } from "./incident-filters";

export function useIncidents(workspaceId: string, filters: IncidentFilters) {
  const normalized = normalizeIncidentFilters(filters);
  return useQuery({
    queryKey: queryKeys.incidents.list(workspaceId, normalized),
    queryFn: () =>
      apiRequest<IncidentDto[]>(
        `/api/v1/workspaces/${workspaceId}/incidents?${incidentApiQuery(normalized)}`
      ),
    placeholderData: keepPreviousData
  });
}

export function useIncident(workspaceId: string, incidentId: string | null) {
  return useQuery({
    queryKey: queryKeys.incidents.detail(workspaceId, incidentId ?? "closed"),
    queryFn: () =>
      apiRequest<IncidentDto>(`/api/v1/workspaces/${workspaceId}/incidents/${incidentId}`),
    enabled: Boolean(incidentId)
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.members(workspaceId),
    queryFn: () =>
      apiRequest<WorkspaceMember[]>(`/api/v1/workspaces/${workspaceId}/members`).then(
        (result) => result.data
      )
  });
}

export function useIncidentTimeline(workspaceId: string, incidentId: string | null) {
  return useInfiniteQuery<
    ApiResponse<TimelineEntryDto[]>,
    Error,
    { pages: ApiResponse<TimelineEntryDto[]>[]; pageParams: (string | undefined)[] },
    ReturnType<typeof queryKeys.incidents.timeline>,
    string | undefined
  >({
    queryKey: queryKeys.incidents.timeline(workspaceId, incidentId ?? "closed"),
    queryFn: ({ pageParam }) =>
      apiRequest<TimelineEntryDto[]>(
        `/api/v1/workspaces/${workspaceId}/incidents/${incidentId}/timeline${
          pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""
        }`
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor,
    enabled: Boolean(incidentId)
  });
}
