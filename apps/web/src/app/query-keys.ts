export const queryKeys = {
  session: ["session"] as const,
  organisations: ["organisations"] as const,
  workspace: (workspaceId: string) => ["workspace", workspaceId] as const,
  incidents: {
    all: (workspaceId: string) => ["incidents", workspaceId] as const,
    list: (workspaceId: string, filters: Record<string, unknown>) =>
      ["incidents", workspaceId, "list", filters] as const,
    detail: (workspaceId: string, incidentId: string) =>
      ["incidents", workspaceId, "detail", incidentId] as const
  }
};
