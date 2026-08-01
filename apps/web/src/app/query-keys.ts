export const queryKeys = {
  session: ["session"] as const,
  organisations: ["organisations"] as const,
  workspace: (workspaceId: string) => ["workspace", workspaceId] as const,
  members: (workspaceId: string) => ["workspace", workspaceId, "members"] as const,
  organisationMembers: (organisationId: string) =>
    ["organisation", organisationId, "members"] as const,
  invitations: (organisationId: string) => ["organisation", organisationId, "invitations"] as const,
  incidents: {
    all: (workspaceId: string) => ["incidents", workspaceId] as const,
    lists: (workspaceId: string) => ["incidents", workspaceId, "list"] as const,
    list: (workspaceId: string, filters: Record<string, unknown>) =>
      ["incidents", workspaceId, "list", filters] as const,
    detail: (workspaceId: string, incidentId: string) =>
      ["incidents", workspaceId, "detail", incidentId] as const,
    timeline: (workspaceId: string, incidentId: string) =>
      ["incidents", workspaceId, "detail", incidentId, "timeline"] as const
  },
  savedViews: (workspaceId: string) => ["saved-views", workspaceId] as const,
  analyticsAll: (workspaceId: string) => ["analytics", workspaceId] as const,
  analytics: (workspaceId: string, days: number) => ["analytics", workspaceId, days] as const,
  auditAll: (workspaceId: string) => ["audit", workspaceId] as const,
  audit: (workspaceId: string, filters: object) => ["audit", workspaceId, filters] as const,
  notifications: ["notifications"] as const
};
