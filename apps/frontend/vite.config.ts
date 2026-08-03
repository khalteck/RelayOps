import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE === "true"
      ? [
          visualizer({
            filename: "../../reports/bundle.html",
            gzipSize: true,
            open: false
          }) as unknown as PluginOption
        ]
      : [])
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    port: 5175,
    strictPort: true,
    open: process.env.PLAYWRIGHT_TEST !== "1" && process.env.CI !== "true",
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: true,
    target: "es2022",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"]
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/helpers/csv.ts",
        "src/modules/auth/components/sign-out-modal.tsx",
        "src/modules/incidents/operations/incident-cache.ts",
        "src/modules/incidents/operations/sla-state.ts"
      ],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 65 }
    }
  }
});
