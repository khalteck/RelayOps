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

export function publishAccessChange(
  userId: string,
  organisationId: string,
  status: "active" | "suspended" | "removed"
): void {
  if (!realtimeServer) return;
  realtimeServer.to(`user:${userId}`).emit("membership.access_changed", { organisationId, status });
  if (status !== "active") {
    void realtimeServer.in(`user:${userId}`).socketsLeave(`organisation:${organisationId}`);
    for (const socket of realtimeServer.sockets.sockets.values()) {
      if (socket.data.userId === userId) {
        for (const room of socket.rooms) if (room.startsWith("workspace:")) socket.leave(room);
      }
    }
  }
}
