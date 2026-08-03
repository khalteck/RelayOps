import type { Page } from "@playwright/test";

export const demoAccounts = {
  owner: "owner@relayops.demo",
  administrator: "admin@relayops.demo",
  responder: "responder@relayops.demo",
  viewer: "viewer@relayops.demo"
} as const;

export async function signIn(page: Page, role: keyof typeof demoAccounts = "owner"): Promise<void> {
  await page.goto(`/login?email=${encodeURIComponent(demoAccounts[role])}`);
  await page.getByLabel("Password").fill("RelayOpsDemo!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app\/[^/]+\/[^/]+\/dashboard/);
}
