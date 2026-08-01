import type { NotificationDto } from "./account-contracts.js";
import type { IncidentDto, TimelineEntryDto } from "./incident-contracts.js";

export const REALTIME_EVENT_NAMES = [
  "incident.created",
  "incident.updated",
  "timeline.created",
  "notification.created"
] as const;
export type RealtimeEventName = (typeof REALTIME_EVENT_NAMES)[number];

export interface ServerToClientEvents {
  "incident.created": (incident: IncidentDto) => void;
  "incident.updated": (incident: IncidentDto) => void;
  "timeline.created": (entry: TimelineEntryDto & { revision: number }) => void;
  "notification.created": (notification: NotificationDto) => void;
}

export interface ClientToServerEvents {
  "workspace.watch": (workspaceId: string) => void;
}
