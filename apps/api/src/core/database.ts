import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { logger } from "./logger.js";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(getEnv().MONGODB_URI, {
    autoIndex: getEnv().NODE_ENV !== "production"
  });
  logger.info("MongoDB connection established");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
