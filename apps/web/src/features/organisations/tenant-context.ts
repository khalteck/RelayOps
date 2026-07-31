import type { OrganisationSummary, WorkspaceSummary } from "@relayops/types";

export interface TenantRouteContext {
  organisation: OrganisationSummary;
  workspace: WorkspaceSummary;
}
