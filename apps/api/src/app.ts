import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { getEnv } from "./config/env.js";
import { isDatabaseReady } from "./core/database.js";
import { errorHandler, notFoundHandler } from "./core/errors.js";
import { logger } from "./core/logger.js";
import { authenticate } from "./middleware/authenticate.js";
import { apiRateLimit } from "./middleware/rate-limits.js";
import { requestContext } from "./middleware/request-context.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";
import { invitationRouter } from "./modules/tenants/invitation.routes.js";
import { realtimeRouter } from "./modules/realtime/realtime.routes.js";
import { tenantRouter } from "./modules/tenants/tenant.routes.js";
import { workspaceRouter } from "./modules/workspaces/workspace.routes.js";

export function createApp(): Express {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(pinoHttp({ logger }));
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(
    cors({
      origin: getEnv().WEB_ORIGIN,
      credentials: true,
      allowedHeaders: ["content-type", "x-csrf-token", "x-request-id"]
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api", apiRateLimit);

  app.get("/health/live", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.get("/health/ready", (_request, response) => {
    response.status(isDatabaseReady() ? 200 : 503).json({
      status: isDatabaseReady() ? "ready" : "not_ready",
      database: isDatabaseReady() ? "connected" : "disconnected"
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/invitations", invitationRouter);
  app.use("/api/v1/organisations", authenticate, tenantRouter);
  app.use("/api/v1/notifications", authenticate, notificationRouter);
  app.use("/api/v1/realtime", authenticate, realtimeRouter);
  app.use("/api/v1/workspaces", authenticate, workspaceRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
