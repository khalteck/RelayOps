import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures/auth";

test("public landing is responsive and accessible @smoke", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Keep every response moving in the same direction." })
  ).toBeVisible();
  await expect(page.locator(".landing-hero__copy")).toHaveCSS("opacity", "1");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Create workspace/ }).first()).toBeVisible();
  const createWorkspace = page.getByRole("link", { name: /Create workspace/ }).first();
  await expect(createWorkspace).toHaveCSS("background-color", "rgb(91, 80, 223)");
  await expect(createWorkspace).toHaveCSS("color", "rgb(255, 255, 255)");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  if (process.env.CAPTURE_LANDING_SCREENSHOTS === "1") {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator(".landing-product-stage")).toHaveCSS("opacity", "1");
    await page.screenshot({ path: "docs/assets/screenshots/landing-light.png" });
  }

  const themeControl = page.getByRole("button", { name: /Theme:/ });
  await themeControl.click();
  await expect(themeControl).toHaveAccessibleName(/Theme: light/);
  await themeControl.click();
  await expect(themeControl).toHaveAccessibleName(/Theme: dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".landing-brand").first()).toHaveCSS("color", "rgb(244, 244, 245)");
  await expect(page.locator(".landing-button--quiet").first()).toHaveCSS(
    "background-color",
    "rgb(23, 24, 29)"
  );
  await expect(createWorkspace).toHaveCSS("background-color", "rgb(91, 80, 223)");
  await expect(createWorkspace).toHaveCSS("color", "rgb(255, 255, 255)");
  const darkAccessibility = await new AxeBuilder({ page }).analyze();
  expect(darkAccessibility.violations).toEqual([]);

  if (process.env.CAPTURE_LANDING_SCREENSHOTS === "1") {
    await page.screenshot({ path: "docs/assets/screenshots/landing-dark.png" });
  }
});

test("mobile navigation stays within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("link", { name: "Workflow" }).last().click();
  await expect(page).toHaveURL(/#workflow$/);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  if (process.env.CAPTURE_LANDING_SCREENSHOTS === "1") {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Keep every response moving in the same direction." })
    ).toBeVisible();
    await expect(page.locator(".landing-hero__copy")).toHaveCSS("opacity", "1");
    await page.screenshot({ path: "docs/assets/screenshots/landing-mobile.png" });
  }
});

test("authenticated visitors can open their dashboard from the landing page", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  const openDashboard = page.getByRole("link", { name: /Open dashboard/ }).first();
  await expect(openDashboard).toBeVisible();
  await openDashboard.click();
  await expect(page).toHaveURL(/\/app\/[^/]+\/[^/]+\/dashboard/);
});

test("reduced motion removes landing animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.locator(".landing-hero__copy");
  await expect(hero).toBeVisible();
  expect(await hero.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});
