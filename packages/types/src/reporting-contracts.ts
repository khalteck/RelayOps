import { z } from "zod";
import type { IncidentSeverity, IncidentStatus } from "./enums.js";
import type { PersonSummary } from "./incident-contracts.js";

export const ANALYTICS_WINDOWS = [7, 30, 90] as const;
export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number];

export interface AnalyticsPoint {
  date: string;
  reported: number;
  resolved: number;
}

export interface NamedCount<TName extends string = string> {
  name: TName;
  count: number;
}

export interface AnalyticsOverview {
  rangeDays: AnalyticsWindow;
  totals: {
    incidents: number;
    open: number;
    mttaMinutes: number | null;
    mttrMinutes: number | null;
    slaCompliancePercent: number | null;
  };
  trend: AnalyticsPoint[];
  byStatus: NamedCount<IncidentStatus>[];
  bySeverity: NamedCount<IncidentSeverity>[];
}

export interface AuditEventDto {
  id: string;
  organisationId: string;
  workspaceId?: string;
  actor: PersonSummary;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
}

const dateFilter = z
  .string()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Date must use YYYY-MM-DD");

export const auditFilterSchema = z.object({
  actorId: z.string().max(80).default(""),
  action: z.string().max(120).default(""),
  entityType: z.string().max(80).default(""),
  from: dateFilter.default(""),
  to: dateFilter.default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(20)
});

export type AuditFilters = z.infer<typeof auditFilterSchema>;
