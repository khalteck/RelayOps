import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  // The auth limiter is intentionally exercised from one shared loopback IP.
  // Serial browser workflows avoid producing artificial local rate-limit noise.
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: [
    {
      command: "pnpm e2e:backend",
      url: "http://127.0.0.1:4100/health/ready",
      timeout: 180_000,
      reuseExistingServer: false
    },
    {
      command:
        "PLAYWRIGHT_TEST=1 VITE_API_PROXY_TARGET=http://127.0.0.1:4100 VITE_SOCKET_URL=http://127.0.0.1:4100 pnpm --filter @relayops/frontend exec vite --host 127.0.0.1 --port 4173",
      url: baseURL,
      timeout: 60_000,
      reuseExistingServer: false
    }
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    {
      name: "demo",
      testMatch: /demo\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], video: "on", trace: "on" }
    }
  ]
});
