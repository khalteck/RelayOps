import type { ClientToServerEvents, ServerToClientEvents } from "@relayops/types";
import type { Server } from "socket.io";

let realtimeServer: Server<ClientToServerEvents, ServerToClientEvents> | undefined;

export function registerRealtimeServer(server: Server<ClientToServerEvents, ServerToClientEvents>) {
  realtimeServer = server;
}

export function publishWorkspaceEvent<TEvent extends keyof ServerToClientEvents>(
  workspaceId: string,
  event: TEvent,
  ...payload: Parameters<ServerToClientEvents[TEvent]>
): void {
  if (!realtimeServer) return;
  realtimeServer.to(`workspace:${workspaceId}`).emit(event, ...payload);
}

export function publishUserEvent(
  userId: string,
  event: "notification.created",
  ...payload: Parameters<ServerToClientEvents["notification.created"]>
): void {
  if (!realtimeServer) return;
  realtimeServer.to(`user:${userId}`).emit(event, ...payload);
}
