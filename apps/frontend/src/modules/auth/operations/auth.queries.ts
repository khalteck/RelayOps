import {
  type LoginInput,
  type RegisterInput,
  type RegisterStartInput,
  type RegistrationChallengeDto,
  type OwnerOnboardingInput,
  type InvitedOnboardingInput,
  type OnboardingDestinationDto,
  type SessionPayload,
  type SessionUser,
  type AccountPreferences,
  type UpdateProfileInput
} from "@relayops/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/helpers/query-keys";
import { ApiError, apiRequest } from "@/services/api-client";
import { useUiStore } from "@/stores/ui.store";

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
      useUiStore.getState().setTheme(data.user.preferences.theme);
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

export function useStartRegistration() {
  return useMutation({
    mutationFn: (input: RegisterStartInput) =>
      apiRequest<RegistrationChallengeDto>("/api/v1/auth/register/start", {
        method: "POST",
        body: JSON.stringify(input)
      })
  });
}

export function useVerifyRegistration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { challengeId: string; code: string }) =>
      apiRequest<SessionPayload>("/api/v1/auth/register/verify", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: ({ data }) => client.setQueryData(queryKeys.session, data)
  });
}

export function useResendRegistration() {
  return useMutation({
    mutationFn: (challengeId: string) =>
      apiRequest<RegistrationChallengeDto>("/api/v1/auth/register/resend", {
        method: "POST",
        body: JSON.stringify({ challengeId })
      })
  });
}

export function useCompleteOwnerOnboarding() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: OwnerOnboardingInput) =>
      apiRequest<OnboardingDestinationDto>("/api/v1/auth/onboarding/owner", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.session });
      await client.invalidateQueries({ queryKey: queryKeys.organisations });
    }
  });
}

export function useCompleteInvitedOnboarding(membershipId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: InvitedOnboardingInput) =>
      apiRequest<OnboardingDestinationDto>(
        `/api/v1/auth/onboarding/members/${membershipId}/complete`,
        { method: "POST", body: JSON.stringify(input) }
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.session });
      await client.invalidateQueries({ queryKey: queryKeys.organisations });
    }
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await apiRequest<void>("/api/v1/auth/logout", { method: "POST" });
      } catch (error) {
        // An unauthenticated response means the browser no longer has a usable
        // session. Treat that state as signed out without exposing auth details.
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    },
    onSuccess: () => client.clear()
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiRequest<SessionUser>("/api/v1/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    onSuccess: ({ data }) => {
      client.setQueryData<SessionPayload>(queryKeys.session, (current) =>
        current ? { ...current, user: data } : current
      );
    }
  });
}

export function useUpdatePreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (preferences: AccountPreferences) =>
      apiRequest<SessionUser>("/api/v1/auth/preferences", {
        method: "PATCH",
        body: JSON.stringify(preferences)
      }),
    onSuccess: ({ data }) => {
      client.setQueryData<SessionPayload>(queryKeys.session, (current) =>
        current ? { ...current, user: data } : current
      );
      useUiStore.getState().setTheme(data.preferences.theme);
    }
  });
}
