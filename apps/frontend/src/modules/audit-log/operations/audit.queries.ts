import type { ApiResponse, AuditEventDto, AuditFilters } from "@relayops/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";

function auditQuery(filters: AuditFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize)
  });
  for (const key of ["actorId", "action", "entityType", "from", "to"] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return params.toString();
}

export function fetchAuditEvents(workspaceId: string, filters: AuditFilters) {
  return apiRequest<AuditEventDto[]>(
    `/api/v1/workspaces/${workspaceId}/audit-events?${auditQuery(filters)}`
  );
}

export function useAuditEvents(workspaceId: string, filters: AuditFilters) {
  return useQuery<ApiResponse<AuditEventDto[]>>({
    queryKey: queryKeys.audit(workspaceId, filters),
    queryFn: () => fetchAuditEvents(workspaceId, filters),
    placeholderData: keepPreviousData
  });
}
