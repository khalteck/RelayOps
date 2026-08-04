import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 10_000,
    setupFiles: "./src/test/setup.ts",
    exclude: ["src/test/integration/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/core/slug.ts",
        "src/modules/incidents/incident.rules.ts",
        "src/modules/tenants/tenant.authorization.ts"
      ],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 }
    }
  }
});
