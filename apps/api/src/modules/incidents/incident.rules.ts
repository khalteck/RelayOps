import {
  canTransitionStatus,
  hasPermission,
  type IncidentPriority,
  type IncidentStatus,
  type Role,
  type SlaPolicy
} from "@relayops/types";
import { AppError } from "../../core/errors.js";

export interface IncidentActorContext {
  userId: string;
  role: Role;
}

export function requireIncidentMutation(
  actor: IncidentActorContext,
  assigneeId: string | undefined
): void {
  if (hasPermission(actor.role, "incident:update:any")) return;
  if (hasPermission(actor.role, "incident:update:assigned") && assigneeId === actor.userId) {
    return;
  }
  throw new AppError(403, "FORBIDDEN", "You can only modify incidents assigned to you");
}

export function requireIncidentComment(
  actor: IncidentActorContext,
  assigneeId: string | undefined
): void {
  if (hasPermission(actor.role, "incident:comment:any")) return;
  if (hasPermission(actor.role, "incident:comment:assigned") && assigneeId === actor.userId) {
    return;
  }
  throw new AppError(403, "FORBIDDEN", "You can only comment on incidents assigned to you");
}

export function requireTransition(from: IncidentStatus, to: IncidentStatus, role: Role): void {
  if (!canTransitionStatus(from, to, role)) {
    throw new AppError(409, "CONFLICT", `Incident cannot move from ${from} to ${to}`);
  }
}

export function slaSnapshot(policy: SlaPolicy, priority: IncidentPriority, reportedAt: Date) {
  const target = policy[priority];
  return {
    sourcePriority: priority,
    acknowledgeTargetMinutes: target.acknowledgeMinutes,
    resolveTargetMinutes: target.resolveMinutes,
    acknowledgeDueAt: new Date(reportedAt.getTime() + target.acknowledgeMinutes * 60_000),
    resolveDueAt: new Date(reportedAt.getTime() + target.resolveMinutes * 60_000)
  };
}
