import { type LoginInput, type RegisterInput, type SessionPayload } from "@relayops/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../app/query-keys";
import { apiRequest } from "../../services/api-client";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiRequest<SessionPayload>("/api/v1/auth/session").then((result) => result.data),
    staleTime: 60_000
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<SessionPayload>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async ({ data }) => {
      client.setQueryData(queryKeys.session, data);
      await client.invalidateQueries({ queryKey: queryKeys.organisations });
    }
  });
}

export function useRegister() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiRequest<SessionPayload>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async ({ data }) => {
      client.setQueryData(queryKeys.session, data);
      await client.invalidateQueries({ queryKey: queryKeys.organisations });
    }
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>("/api/v1/auth/logout", { method: "POST" }),
    onSuccess: () => client.clear()
  });
}
