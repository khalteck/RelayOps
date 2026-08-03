import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures/auth";

test("captures the local review gallery", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.screenshot({ path: "docs/assets/screenshots/dashboard-light.png", fullPage: true });
  await page
    .getByRole("img", { name: "Reported and resolved incident trend" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/assets/screenshots/analytics.png" });
  await page.getByRole("heading", { name: "Dashboard" }).scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: /owner/i }).click();
  await page.getByText(/Theme:/).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /owner/i }).click();
  await page.getByText(/Theme:/).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "docs/assets/screenshots/dashboard-dark.png", fullPage: true });

  await page.getByRole("menuitem", { name: "Incidents" }).click();
  await page.locator("tr[data-incident-row]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "docs/assets/screenshots/incident-drawer.png", fullPage: true });

  await page.getByRole("button", { name: /close/i }).click();
  await page.getByRole("menuitem", { name: "Audit log" }).click();
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  await page.screenshot({ path: "docs/assets/screenshots/audit-log.png", fullPage: true });

  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("menuitem", { name: "User management" }).click();
  await expect(page.getByRole("button", { name: "Invite user" })).toBeVisible();
  await page.screenshot({ path: "docs/assets/screenshots/settings.png", fullPage: true });
});

test("captures mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("menuitem", { name: "Dashboard" })).toBeVisible();
  await page.screenshot({ path: "docs/assets/screenshots/mobile-navigation.png", fullPage: true });
});
