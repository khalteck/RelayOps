import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures/auth";

test("records the RelayOps product walkthrough", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.waitForTimeout(800);
  await page.getByRole("menuitem", { name: "Incidents" }).click();
  await expect(page).toHaveURL(/\/incidents/);
  await page.waitForTimeout(800);
  await page.locator("tr[data-incident-row]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(800);
});
