import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  snapshotDir: "./tests/__snapshots__",
  // In CI the visual job runs separately; skip visual.spec.ts in the main e2e job.
  testIgnore: process.env.PLAYWRIGHT_SKIP_VISUAL ? ["**/visual.spec.ts"] : [],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  expect: {
    toHaveScreenshot: {
      // Tolerate up to 2% of pixels differing to absorb sub-pixel font rendering
      // differences across OS / GPU without triggering false positives.
      maxDiffPixelRatio: 0.02,
    },
  },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium",      use: { ...devices["Desktop Chrome"] } },
    { name: "firefox",       use: { ...devices["Desktop Firefox"] } },
    // Full Pixel 5 emulation (hasTouch: true, isMobile: true).
    // Runs all non-layout tests. Radix Select's pointer-event handling is
    // incompatible with Playwright's touch emulation, so layout/flow tests
    // that require dropdown interaction use mobile-viewport instead.
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    // Chromium at Pixel 5 viewport dimensions, without touch emulation.
    // Used by mobile.spec.ts for responsive-layout and full-flow tests —
    // gives genuine 393 px layout coverage while keeping pointer events intact.
    // Chromium at Pixel 5 viewport dimensions, without touch emulation or
    // mobile user-agent. Used by mobile.spec.ts for responsive-layout and
    // full-flow tests — genuine 393 px layout coverage with intact pointer events.
    {
      name: "mobile-viewport",
      use: {
        viewport: { width: 393, height: 851 },
      },
    },
  ],

  webServer: {
    // CI: production build is pre-built by the workflow; just start the server.
    // Local cold start: build then serve so e2e always runs against the production
    // bundle. If a server is already running on :3000 (e.g. `npm run dev`), it
    // is reused as-is — start a prod server manually for full alignment locally.
    command: process.env.CI ? "npm start" : "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
