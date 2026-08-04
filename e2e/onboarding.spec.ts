import { expect, test } from "@playwright/test";

test("new owner verifies email and completes onboarding", async ({ page }) => {
  const email = `owner-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Your name").fill("E2E Verified Owner");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill("A-secure-test-password!");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();

  const emailResponse = await page.request.get(
    `/api/v1/test/emails/latest?to=${encodeURIComponent(email)}`
  );
  const message = (await emailResponse.json()).data.text as string;
  const code = message.match(/\b\d{6}\b/)?.[0];
  expect(code).toBeTruthy();
  const digits = page.locator(".ant-otp input");
  for (let index = 0; index < 6; index += 1) await digits.nth(index).fill(code?.[index] ?? "");
  await page.getByRole("button", { name: "Verify email" }).click();

  await expect(page.getByRole("heading", { name: /name the places/i })).toBeVisible();
  await page.getByLabel("Organisation").fill("E2E Verification Ops");
  await page.getByLabel("First workspace").fill("Platform");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: /choose your working preferences/i })
  ).toBeVisible();
  await page.getByText("Dark", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page).toHaveURL(/\/app\/.*\/dashboard/);
});
