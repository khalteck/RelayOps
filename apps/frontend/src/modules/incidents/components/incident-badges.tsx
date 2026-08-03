import type { IncidentPriority, IncidentSeverity, IncidentStatus } from "@relayops/types";
import { incidentStatusLabels } from "@relayops/types";
import { Tag } from "antd";

const statusColors: Record<IncidentStatus, string> = {
  reported: "red",
  acknowledged: "orange",
  investigating: "blue",
  monitoring: "purple",
  resolved: "green"
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <Tag color={statusColors[status]}>{incidentStatusLabels[status]}</Tag>;
}

export function PriorityBadge({ priority }: { priority: IncidentPriority }) {
  return (
    <span className={`priority-badge priority-badge--${priority.toLowerCase()}`}>{priority}</span>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return <Tag>{severity}</Tag>;
}
