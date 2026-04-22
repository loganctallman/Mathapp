import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "**/*.spec.*",
        // Next.js boilerplate — no testable logic
        "src/app/layout.tsx",
        "src/app/manifest.ts",
        // Browser-API-only components (beforeinstallprompt, matchMedia,
        // navigator.serviceWorker) — covered by e2e, not unit-testable in jsdom
        "src/components/InstallPrompt.tsx",
        "src/components/ServiceWorkerRegistrar.tsx",
      ],
      thresholds: {
        statements: 90,
        branches:   88,
        functions:  85,
        lines:      90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
