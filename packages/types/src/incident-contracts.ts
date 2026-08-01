import { z } from "zod";
import {
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  TIMELINE_KINDS,
  type IncidentPriority,
  type IncidentSeverity,
  type IncidentStatus,
  type TimelineKind
} from "./enums.js";

export const INCIDENT_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "priority",
  "severity",
  "status"
] as const;
export type IncidentSortField = (typeof INCIDENT_SORT_FIELDS)[number];
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const createIncidentInputSchema = z.object({
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(10_000),
  affectedService: z.string().trim().min(2).max(120),
  priority: z.enum(INCIDENT_PRIORITIES),
  severity: z.enum(INCIDENT_SEVERITIES),
  assigneeId: z.string().nullable().optional()
});

export const classifyIncidentInputSchema = z
  .object({
    priority: z.enum(INCIDENT_PRIORITIES).optional(),
    severity: z.enum(INCIDENT_SEVERITIES).optional()
  })
  .refine((value) => value.priority !== undefined || value.severity !== undefined, {
    message: "At least one classification must change"
  });

export const assignIncidentInputSchema = z.object({ assigneeId: z.string().nullable() });
export const transitionIncidentInputSchema = z.object({ status: z.enum(INCIDENT_STATUSES) });
export const commentInputSchema = z.object({ body: z.string().trim().min(1).max(4_000) });

export const incidentFilterSchema = z.object({
  search: z.string().trim().max(100).default(""),
  statuses: z.array(z.enum(INCIDENT_STATUSES)).default([]),
  priorities: z.array(z.enum(INCIDENT_PRIORITIES)).default([]),
  severities: z.array(z.enum(INCIDENT_SEVERITIES)).default([]),
  assignee: z.string().trim().max(80).default(""),
  sortBy: z.enum(INCIDENT_SORT_FIELDS).default("createdAt"),
  sortDirection: z.enum(SORT_DIRECTIONS).default("desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(20)
});

export type CreateIncidentInput = z.infer<typeof createIncidentInputSchema>;
export type ClassifyIncidentInput = z.infer<typeof classifyIncidentInputSchema>;
export type IncidentFilters = z.infer<typeof incidentFilterSchema>;

export interface PersonSummary {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceMember extends PersonSummary {
  role: "owner" | "administrator" | "responder" | "viewer";
}

export interface IncidentSlaDto {
  sourcePriority: IncidentPriority;
  acknowledgeTargetMinutes: number;
  resolveTargetMinutes: number;
  acknowledgeDueAt: string;
  resolveDueAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface IncidentDto {
  id: string;
  organisationId: string;
  workspaceId: string;
  title: string;
  description: string;
  affectedService: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  reporter: PersonSummary;
  assignee: PersonSummary | null;
  sla: IncidentSlaDto;
  revision: number;
  reportedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntryDto {
  id: string;
  incidentId: string;
  actor: PersonSummary;
  kind: TimelineKind;
  body?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TimelinePage {
  items: TimelineEntryDto[];
  nextCursor?: string;
}

export interface SavedViewDefinition {
  filters: Omit<IncidentFilters, "page">;
  visibleColumns: string[];
}

export const savedViewInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  definition: z.object({
    filters: incidentFilterSchema.omit({ page: true }),
    visibleColumns: z.array(z.string().trim().min(1).max(60)).max(20)
  })
});

export interface SavedViewDto {
  id: string;
  workspaceId: string;
  name: string;
  definition: SavedViewDefinition;
  createdAt: string;
  updatedAt: string;
}

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  reported: "Reported",
  acknowledged: "Acknowledged",
  investigating: "Investigating",
  monitoring: "Monitoring",
  resolved: "Resolved"
};

export const timelineKindLabels: Record<TimelineKind, string> = Object.fromEntries(
  TIMELINE_KINDS.map((kind) => [kind, kind.replaceAll("_", " ")])
) as Record<TimelineKind, string>;
