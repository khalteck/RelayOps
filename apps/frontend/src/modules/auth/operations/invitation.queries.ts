import type { InvitationPreviewDto } from "@relayops/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { apiRequest } from "@/services/api-client";

interface AcceptInvitationInput {
  accountExists: boolean;
  name: string;
  password: string;
}

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: queryKeys.invitationPreview(token),
    queryFn: () =>
      apiRequest<InvitationPreviewDto>(`/api/v1/invitations/${token}`).then(
        (result) => result.data
      ),
    retry: false
  });
}

export function useAcceptInvitation(token: string) {
  return useMutation({
    mutationFn: ({ accountExists, name, password }: AcceptInvitationInput) =>
      apiRequest<{ email: string }>(`/api/v1/invitations/${token}/accept`, {
        method: "POST",
        body: JSON.stringify({ ...(accountExists ? {} : { name }), password })
      })
  });
}
