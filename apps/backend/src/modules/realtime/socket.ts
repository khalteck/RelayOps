import type { Server as HttpServer } from "node:http";
import type { ClientToServerEvents, ServerToClientEvents } from "@relayops/types";
import { Server } from "socket.io";
import { getEnv } from "../../config/env.js";
import { logger } from "../../core/logger.js";
import { MembershipModel } from "../../models/membership.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { verifyRealtimeTicket } from "../auth/auth.tokens.js";
import { registerRealtimeServer } from "./realtime.publisher.js";

export function createSocketServer(server: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: getEnv().WEB_ORIGIN,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });
  registerRealtimeServer(io);

  io.use(async (socket, next) => {
    const ticket = socket.handshake.auth.ticket as string | undefined;
    if (!ticket) return next(new Error("Authentication ticket is required"));
    try {
      socket.data.userId = await verifyRealtimeTicket(ticket);
      next();
    } catch {
      next(new Error("Authentication ticket is invalid or expired"));
    }
  });

  io.on("connection", async (socket) => {
    socket.join(`user:${socket.data.userId}`);
    const memberships = await MembershipModel.find({ userId: socket.data.userId }).lean();
    for (const membership of memberships) {
      socket.join(`organisation:${String(membership.organisationId)}`);
      const workspaceIds = ["owner", "administrator"].includes(membership.role)
        ? (
            await WorkspaceModel.find({ organisationId: membership.organisationId })
              .select("_id")
              .lean()
          ).map((workspace) => workspace._id)
        : membership.workspaceIds;
      workspaceIds.forEach((workspaceId) => {
        socket.join(`workspace:${String(workspaceId)}`);
      });
    }
    logger.debug({ socketId: socket.id, userId: socket.data.userId }, "Realtime client connected");
  });

  return io;
}
