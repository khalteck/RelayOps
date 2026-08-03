import { getEnv } from "../../config/env.js";
import { connectDatabase } from "../../core/database.js";
import { logger } from "../../core/logger.js";
import { seedIncidentHistory } from "./incidents.js";
import { seedDemoNotifications } from "./notifications.js";
import { seedTenants } from "./tenants.js";

export async function seedDemo(): Promise<void> {
  const password = getEnv().DEMO_PASSWORD;
  if (!password) throw new Error("DEMO_PASSWORD is required to seed demo accounts");
  await connectDatabase();
  const context = await seedTenants(password);
  const incidents = await seedIncidentHistory(context);
  await seedDemoNotifications(context);
  logger.info(
    { accounts: context.users.size, organisations: 2, workspaces: 3, incidents },
    "Demo data seeded"
  );
}
