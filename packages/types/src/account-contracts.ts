import { z } from "zod";
import { ROLES, type Role } from "./enums.js";
import type { WorkspaceSummary } from "./contracts.js";
import { accountPreferencesSchema, passwordSchema } from "./contracts.js";

export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(80)
});

export const inviteMemberInputSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  role: z.enum(ROLES).exclude(["owner"]),
  workspaceIds: z.array(z.string().min(1)).min(1).max(50)
});

export const acceptInvitationInputSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  password: passwordSchema.optional()
});

export const ownerOnboardingInputSchema = z.object({
  organisationName: z.string().trim().min(2).max(100),
  workspaceName: z.string().trim().min(2).max(100),
  preferences: accountPreferencesSchema
});

export const invitedOnboardingInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  preferences: accountPreferencesSchema
});

export const membershipStatusInputSchema = z.object({
  status: z.enum(["active", "suspended"])
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberInputSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;
export type OwnerOnboardingInput = z.infer<typeof ownerOnboardingInputSchema>;
export type InvitedOnboardingInput = z.infer<typeof invitedOnboardingInputSchema>;
export type MembershipStatusInput = z.infer<typeof membershipStatusInputSchema>;

export type MembershipStatus = "pending_onboarding" | "active" | "suspended";

export interface OrganisationMemberDto {
  membershipId: string;
  user: { id: string; name: string; email: string };
  role: Role;
  workspaceIds: string[];
  status: MembershipStatus;
  joinedAt: string;
}

export interface InvitationDto {
  id: string;
  email: string;
  role: Exclude<Role, "owner">;
  workspaceIds: string[];
  invitedBy: { id: string; name: string; email: string };
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  createdAt: string;
  deliveryStatus: "queued" | "sent" | "delivered" | "failed" | "bounced";
}

export interface InvitationPreviewDto {
  email: string;
  role: Exclude<Role, "owner">;
  organisationName: string;
  workspaces: Pick<WorkspaceSummary, "id" | "name" | "slug">[];
  invitedByName: string;
  expiresAt: string;
  accountExists: boolean;
}

export interface OnboardingDestinationDto {
  destinationPath: string;
}

export const NOTIFICATION_KINDS = [
  "incident_assigned",
  "incident_updated",
  "incident_commented",
  "membership_added"
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  organisationId?: string;
  workspaceId?: string;
  resourcePath?: string;
  readAt?: string;
  createdAt: string;
}

export interface NotificationListDto {
  items: NotificationDto[];
  unreadCount: number;
}
