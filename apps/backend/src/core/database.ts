import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { logger } from "./logger.js";
import { MembershipModel } from "../models/membership.model.js";
import { UserModel } from "../models/user.model.js";

async function runCompatibilityMigrations(): Promise<void> {
  const [memberships, users] = await Promise.all([
    MembershipModel.updateMany({ status: { $exists: false } }, { $set: { status: "active" } }),
    UserModel.updateMany({ emailVerifiedAt: { $exists: false } }, [
      { $set: { emailVerifiedAt: "$createdAt" } }
    ])
  ]);
  if (memberships.modifiedCount || users.modifiedCount)
    logger.info(
      { memberships: memberships.modifiedCount, users: users.modifiedCount },
      "Compatibility migrations applied"
    );
}

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(getEnv().MONGODB_URI, {
    autoIndex: getEnv().NODE_ENV !== "production"
  });
  await runCompatibilityMigrations();
  logger.info("MongoDB connection established");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
