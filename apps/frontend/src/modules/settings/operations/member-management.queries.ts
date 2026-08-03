import type { InvitationDto, InviteMemberInput, OrganisationMemberDto } from "@relayops/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";

export function useOrganisationMembers(organisationId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.organisationMembers(organisationId),
    queryFn: () =>
      apiRequest<OrganisationMemberDto[]>(`/api/v1/organisations/${organisationId}/members`).then(
        (result) => result.data
      ),
    enabled
  });
}

export function useInvitations(organisationId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.invitations(organisationId),
    queryFn: () =>
      apiRequest<InvitationDto[]>(`/api/v1/organisations/${organisationId}/invitations`).then(
        (result) => result.data
      ),
    enabled
  });
}

export function useInviteMember(organisationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) =>
      apiRequest<InvitationDto>(`/api/v1/organisations/${organisationId}/invitations`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.invitations(organisationId) });
    }
  });
}
