export const ROLES = ["owner", "administrator", "responder", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const INCIDENT_STATUSES = [
  "reported",
  "acknowledged",
  "investigating",
  "monitoring",
  "resolved"
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
export type IncidentPriority = (typeof INCIDENT_PRIORITIES)[number];

export const INCIDENT_SEVERITIES = ["SEV1", "SEV2", "SEV3", "SEV4"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const TIMELINE_KINDS = [
  "incident_created",
  "status_changed",
  "assignment_changed",
  "classification_changed",
  "sla_changed",
  "comment"
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];
