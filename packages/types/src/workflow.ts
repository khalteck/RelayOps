import type { IncidentStatus, Role } from "./enums.js";

const nextStatus: Partial<Record<IncidentStatus, IncidentStatus>> = {
  reported: "acknowledged",
  acknowledged: "investigating",
  investigating: "monitoring",
  monitoring: "resolved"
};

export function canTransitionStatus(from: IncidentStatus, to: IncidentStatus, role: Role): boolean {
  if (nextStatus[from] === to) return true;
  return from === "resolved" && to === "investigating" && ["owner", "administrator"].includes(role);
}

export function nextIncidentStatus(status: IncidentStatus): IncidentStatus | undefined {
  return nextStatus[status];
}
