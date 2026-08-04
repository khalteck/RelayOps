import { createServer } from "node:http";
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./core/database.js";
import { logger } from "./core/logger.js";
import { createSocketServer } from "./modules/realtime/socket.js";
import { retryQueuedEmails } from "./modules/email/email.service.js";

async function start(): Promise<void> {
  await connectDatabase();
  const server = createServer(createApp());
  const io = createSocketServer(server);
  const emailRetryTimer = setInterval(() => void retryQueuedEmails(), 60_000);
  emailRetryTimer.unref();

  server.listen(getEnv().PORT, "0.0.0.0", () => {
    logger.info({ port: getEnv().PORT }, "RelayOps API is listening");
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Graceful shutdown started");
    io.close();
    clearInterval(emailRetryTimer);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((error: unknown) => {
  logger.fatal({ err: error }, "API startup failed");
  process.exit(1);
});
