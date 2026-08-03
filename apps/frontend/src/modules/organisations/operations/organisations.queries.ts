import type { OrganisationSummary, SlaPolicy, WorkspaceSummary } from "@relayops/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";

export function useOrganisations() {
  return useQuery({
    queryKey: queryKeys.organisations,
    queryFn: () =>
      apiRequest<OrganisationSummary[]>("/api/v1/organisations").then((result) => result.data)
  });
}

export function useCreateOrganisation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiRequest<OrganisationSummary>("/api/v1/organisations", {
        method: "POST",
        body: JSON.stringify({ name })
      }),
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.organisations })
  });
}

export function useCreateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ organisationId, name }: { organisationId: string; name: string }) =>
      apiRequest<WorkspaceSummary>(`/api/v1/organisations/${organisationId}/workspaces`, {
        method: "POST",
        body: JSON.stringify({ name })
      }),
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.organisations })
  });
}

export function useUpdateOrganisation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ organisationId, name }: { organisationId: string; name: string }) =>
      apiRequest<void>(`/api/v1/organisations/${organisationId}`, {
        method: "PATCH",
        body: JSON.stringify({ name })
      }),
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.organisations })
  });
}

export function useUpdateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      name,
      slaPolicy
    }: {
      workspaceId: string;
      name?: string;
      slaPolicy?: SlaPolicy;
    }) =>
      apiRequest<WorkspaceSummary>(
        `/api/v1/organisations/workspaces/${workspaceId}${slaPolicy ? "/sla" : ""}`,
        {
          method: "PATCH",
          body: JSON.stringify(slaPolicy ? { slaPolicy } : { name })
        }
      ),
    onSuccess: async () => client.invalidateQueries({ queryKey: queryKeys.organisations })
  });
}
