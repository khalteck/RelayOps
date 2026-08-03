import { createServer } from "node:http";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const backendPort = 4100;
const frontendOrigin = "http://127.0.0.1:4173";

async function start(): Promise<void> {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" }
  });

  Object.assign(process.env, {
    NODE_ENV: "test",
    PORT: String(backendPort),
    MONGODB_URI: replSet.getUri("relayops-e2e"),
    WEB_ORIGIN: frontendOrigin,
    ACCESS_TOKEN_SECRET: "e2e-access-secret-that-is-at-least-32-characters",
    REFRESH_TOKEN_SECRET: "e2e-refresh-secret-that-is-at-least-32-characters",
    REALTIME_TICKET_SECRET: "e2e-realtime-secret-that-is-at-least-32-characters",
    AUTH_RATE_LIMIT: "100",
    DEMO_PASSWORD: "RelayOpsDemo!2026",
    LOG_LEVEL: "warn"
  });

  const [{ createApp }, { disconnectDatabase }, { createSocketServer }, { seedDemo }] =
    await Promise.all([
      import("../../apps/backend/src/app.js"),
      import("../../apps/backend/src/core/database.js"),
      import("../../apps/backend/src/modules/realtime/socket.js"),
      import("../../apps/backend/src/scripts/seed/index.js")
    ]);

  await seedDemo();
  const server = createServer(createApp());
  const io = createSocketServer(server);
  await new Promise<void>((resolve) => server.listen(backendPort, "127.0.0.1", resolve));
  process.stdout.write(`RelayOps E2E backend listening on ${backendPort}\n`);

  let closing = false;
  async function shutdown(): Promise<void> {
    if (closing) return;
    closing = true;
    io.close();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await disconnectDatabase();
    await replSet.stop();
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      void shutdown().finally(() => process.exit(0));
    });
  }
}

start().catch((error: unknown) => {
  process.stderr.write(
    `E2E backend failed: ${error instanceof Error ? error.message : "unknown"}\n`
  );
  process.exit(1);
});
