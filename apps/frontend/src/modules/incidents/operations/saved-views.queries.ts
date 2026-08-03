import type { IncidentFilters, SavedViewDefinition, SavedViewDto } from "@relayops/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";

export function useSavedViews(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.savedViews(workspaceId),
    queryFn: () =>
      apiRequest<SavedViewDto[]>(`/api/v1/workspaces/${workspaceId}/saved-views`).then(
        (result) => result.data
      )
  });
}

export function useSaveView(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      filters,
      visibleColumns
    }: {
      name: string;
      filters: IncidentFilters;
      visibleColumns: string[];
    }) => {
      const definition: SavedViewDefinition = {
        filters: {
          search: filters.search,
          statuses: filters.statuses,
          priorities: filters.priorities,
          severities: filters.severities,
          assignee: filters.assignee,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
          pageSize: filters.pageSize
        },
        visibleColumns
      };
      return apiRequest<SavedViewDto>(`/api/v1/workspaces/${workspaceId}/saved-views`, {
        method: "POST",
        body: JSON.stringify({ name, definition })
      });
    },
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.savedViews(workspaceId) })
  });
}

export function useDeleteSavedView(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (viewId: string) =>
      apiRequest<void>(`/api/v1/workspaces/${workspaceId}/saved-views/${viewId}`, {
        method: "DELETE"
      }),
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.savedViews(workspaceId) })
  });
}
