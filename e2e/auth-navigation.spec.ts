import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures/auth";

test("@smoke signs in, restores navigation, and has no serious axe violations", async ({
  page
}) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Audit log" })).toBeVisible();
  const complianceText = await page
    .getByText("SLA compliance", { exact: true })
    .locator("..")
    .getByText(/\d+%/)
    .textContent();
  expect(Number.parseInt(complianceText ?? "101", 10)).toBeLessThanOrEqual(100);

  const accessibility = await new AxeBuilder({ page }).exclude(".recharts-wrapper").analyze();
  expect(
    accessibility.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? "")
    )
  ).toEqual([]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow).toBe(false);
});

test("viewer receives permission-aware navigation", async ({ page }) => {
  await signIn(page, "viewer");
  await expect(page.getByRole("menuitem", { name: "Audit log" })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Incidents" }).click();
  await expect(page).toHaveURL(/\/incidents/);
  await expect(page.getByRole("button", { name: /report incident/i })).toHaveCount(0);
});

test("@smoke supports a mobile keyboard-accessible navigation drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.getByRole("button", { name: "Open navigation" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Incidents" })).toBeVisible();
});
