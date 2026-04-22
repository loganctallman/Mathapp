import { test, expect } from "./fixtures";

// Visual baselines are generated against Chromium only.
// Running against Firefox or mobile would produce different anti-aliasing / font
// rendering, causing false positives on every run.
test.describe("Visual regression", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Visual baselines are Chromium-only"
  );

  test.beforeEach(async ({ page }) => {
    // Disable CSS transitions and animations so screenshots are pixel-stable
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  // ── Fully deterministic states (no masking required) ────────────────────────

  test("config — initial state", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("config-initial.png");
  });

  test("config — all selectors filled, sliders and Generate button visible", async ({
    page,
    selectionMenu,
  }) => {
    await page.goto("/");
    await selectionMenu.configure("addition", "2", "2");
    await expect(page).toHaveScreenshot("config-complete.png");
  });

  test("info modal — open", async ({ page, infoModal }) => {
    await page.goto("/");
    await infoModal.open();
    await expect(page).toHaveScreenshot("info-modal.png");
  });

  // ── States with dynamic content — targeted masking ──────────────────────────

  test("problem grid — card layout and buttons (random operands masked)", async ({
    page,
    selectionMenu,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot("problem-grid.png", {
      // Mask the problem grid itself (random left/right operands change each run).
      // The card border, header, timer pill, and footer buttons remain visible.
      mask: [page.locator("div.grid.gap-3")],
    });
  });

  test("result card — post-submit layout (timer masked)", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    // Fill "0" for all answers → guaranteed 0 / 20 → "Keep practicing" message
    await problemGrid.fillAndSubmit("0");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot("result-submitted.png", {
      mask: [
        // Timer display changes every run
        page.locator("span.font-mono.tabular-nums"),
        // Problem grid: "✗ <correct_answer>" labels expose random numbers
        page.locator("div.grid.gap-3"),
      ],
    });
  });

  test("score history — panel after a session (timestamps masked)", async ({
    page,
    selectionMenu,
    problemGrid,
    scoreHistory,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("0");
    await expect(scoreHistory.heading).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot("score-history.png", {
      mask: [
        // Timer display and session-time values in history rows
        page.locator("span.font-mono.tabular-nums"),
        // Problem grid: exposes random correct answers in submitted state
        page.locator("div.grid.gap-3"),
      ],
    });
  });
});
