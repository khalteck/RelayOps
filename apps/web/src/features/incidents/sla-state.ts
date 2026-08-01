import type { IncidentDto } from "@relayops/types";

export type SlaStateName = "healthy" | "at-risk" | "breached" | "met";

export interface SlaState {
  phase: "acknowledge" | "resolve";
  state: SlaStateName;
  label: string;
  deadline: string;
  remainingMs: number;
}

export function incidentSlaState(incident: IncidentDto, serverTime: string): SlaState {
  const acknowledgementActive = !incident.sla.acknowledgedAt;
  const phase = acknowledgementActive ? "acknowledge" : "resolve";
  const deadline = acknowledgementActive
    ? incident.sla.acknowledgeDueAt
    : incident.sla.resolveDueAt;
  const completedAt = acknowledgementActive ? undefined : incident.sla.resolvedAt;
  const targetMinutes = acknowledgementActive
    ? incident.sla.acknowledgeTargetMinutes
    : incident.sla.resolveTargetMinutes;
  const comparisonTime = completedAt ?? serverTime;
  const remainingMs = new Date(deadline).getTime() - new Date(comparisonTime).getTime();
  const breached = remainingMs < 0;
  const state: SlaStateName = completedAt
    ? breached
      ? "breached"
      : "met"
    : breached
      ? "breached"
      : remainingMs <= targetMinutes * 60_000 * 0.2
        ? "at-risk"
        : "healthy";
  return {
    phase,
    state,
    label: `${phase === "acknowledge" ? "Acknowledge" : "Resolve"} ${state.replace("-", " ")}`,
    deadline,
    remainingMs
  };
}

export function formatRemaining(milliseconds: number): string {
  const absoluteMinutes = Math.max(0, Math.ceil(Math.abs(milliseconds) / 60_000));
  const days = Math.floor(absoluteMinutes / 1_440);
  const hours = Math.floor((absoluteMinutes % 1_440) / 60);
  const minutes = absoluteMinutes % 60;
  const value = days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  return milliseconds < 0 ? `${value} overdue` : `${value} remaining`;
}
