export const INCIDENT_COLUMNS = [
  "title",
  "status",
  "priority",
  "severity",
  "assignee",
  "sla",
  "updatedAt"
] as const;

export type IncidentColumnKey = (typeof INCIDENT_COLUMNS)[number];

export const incidentColumnLabels: Record<IncidentColumnKey, string> = {
  title: "Incident",
  status: "Status",
  priority: "Priority",
  severity: "Impact",
  assignee: "Responder",
  sla: "SLA",
  updatedAt: "Updated"
};

export function readVisibleColumns(value: string | null): IncidentColumnKey[] {
  if (!value) return [...INCIDENT_COLUMNS];
  const columns = value
    .split(",")
    .filter((column): column is IncidentColumnKey =>
      INCIDENT_COLUMNS.includes(column as IncidentColumnKey)
    );
  return columns.length ? columns : [...INCIDENT_COLUMNS];
}
