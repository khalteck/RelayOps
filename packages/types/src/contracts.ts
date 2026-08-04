import { z } from "zod";
import { INCIDENT_PRIORITIES, type Role } from "./enums.js";

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  nextCursor?: string;
  serverTime: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "RATE_LIMITED"
      | "INTERNAL_ERROR";
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export const loginInputSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128)
});

export const registerStartInputSchema = loginInputSchema.extend({
  name: z.string().trim().min(2).max(80)
});

export const registerInputSchema = registerStartInputSchema.extend({
  organisationName: z.string().trim().min(2).max(100),
  workspaceName: z.string().trim().min(2).max(100)
});

export const verifyRegistrationInputSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/)
});

export const resendRegistrationInputSchema = z.object({ challengeId: z.string().min(1) });

export const tenantNameInputSchema = z.object({
  name: z.string().trim().min(2).max(100)
});

const slaTargetSchema = z.object({
  acknowledgeMinutes: z.number().int().min(1).max(43_200),
  resolveMinutes: z.number().int().min(1).max(525_600)
});

export const slaPolicySchema = z.object(
  Object.fromEntries(INCIDENT_PRIORITIES.map((priority) => [priority, slaTargetSchema])) as Record<
    (typeof INCIDENT_PRIORITIES)[number],
    typeof slaTargetSchema
  >
);

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type RegisterStartInput = z.infer<typeof registerStartInputSchema>;
export type VerifyRegistrationInput = z.infer<typeof verifyRegistrationInputSchema>;
export type ResendRegistrationInput = z.infer<typeof resendRegistrationInputSchema>;
export type SlaPolicy = z.infer<typeof slaPolicySchema>;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  preferences: AccountPreferences;
}

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export interface AccountPreferences {
  theme: ThemePreference;
  inApp: {
    incidentAssigned: boolean;
    incidentUpdated: boolean;
    incidentCommented: boolean;
  };
}

export const accountPreferencesSchema = z.object({
  theme: z.enum(THEME_PREFERENCES),
  inApp: z.object({
    incidentAssigned: z.boolean(),
    incidentUpdated: z.boolean(),
    incidentCommented: z.boolean()
  })
});

export type OnboardingState =
  | { required: false }
  | { required: true; kind: "owner" }
  | {
      required: true;
      kind: "invited";
      membershipId: string;
      organisationName: string;
      role: Role;
      workspaceNames: string[];
    };

export interface RegistrationChallengeDto {
  challengeId: string;
  maskedEmail: string;
  expiresAt: string;
  resendAvailableAt: string;
}

export interface WorkspaceSummary {
  id: string;
  organisationId: string;
  name: string;
  slug: string;
  slaPolicy: SlaPolicy;
}

export interface OrganisationSummary {
  id: string;
  name: string;
  slug: string;
  role: Role;
  permissions: readonly string[];
  workspaces: WorkspaceSummary[];
}

export interface SessionPayload {
  user: SessionUser;
  csrfToken: string;
  onboarding: OnboardingState;
}
