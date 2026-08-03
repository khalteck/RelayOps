import type { AnalyticsOverview, AnalyticsWindow } from "@relayops/types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";

export function useAnalytics(workspaceId: string, days: AnalyticsWindow) {
  return useQuery({
    queryKey: queryKeys.analytics(workspaceId, days),
    queryFn: () =>
      apiRequest<AnalyticsOverview>(
        `/api/v1/workspaces/${workspaceId}/analytics?days=${days}`
      ).then((result) => result.data)
  });
}
