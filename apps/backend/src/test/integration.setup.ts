import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";

let replicaSet: MongoMemoryReplSet | undefined;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.WEB_ORIGIN = "http://localhost:5175";
  process.env.ACCESS_TOKEN_SECRET = "integration-access-secret-that-is-at-least-32-characters";
  process.env.REFRESH_TOKEN_SECRET = "integration-refresh-secret-that-is-at-least-32-characters";
  process.env.REALTIME_TICKET_SECRET = "integration-ticket-secret-that-is-at-least-32-characters";
  process.env.LOG_LEVEL = "fatal";
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" }
  });
  process.env.MONGODB_URI = replicaSet.getUri("relayops-integration");
  const { connectDatabase } = await import("../core/database.js");
  await connectDatabase();
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  if (!replicaSet) return;
  const { disconnectDatabase } = await import("../core/database.js");
  await disconnectDatabase();
  await replicaSet.stop();
});
