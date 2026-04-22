import { test, expect } from "./fixtures";

// ── localStorage failure modes ────────────────────────────────────────────────

test.describe("Chaos — localStorage failure modes", () => {
  test("app renders with empty history when localStorage is fully blocked", async ({
    page,
  }) => {
    // Simulates private-browsing mode or strict security settings where
    // any localStorage access throws a SecurityError.
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get: () => ({
          getItem:    () => { throw new DOMException("SecurityError"); },
          setItem:    () => { throw new DOMException("SecurityError"); },
          removeItem: () => { throw new DOMException("SecurityError"); },
          clear:      () => { throw new DOMException("SecurityError"); },
          length: 0,
          key:    () => null,
        }),
        configurable: true,
      });
    });

    await page.goto("/");

    // App must render without crashing
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Math Trainer");
    // Score history section gracefully absent — no data to show
    await expect(page.getByText("Recent Sessions")).not.toBeVisible();
  });

  test("result card shows after submit even when localStorage.setItem throws (quota exceeded)", async ({
    page,
    selectionMenu,
    problemGrid,
    scoreHistory,
  }) => {
    // Simulates a full storage quota. getItem still works (reads existing data),
    // but every write fails. The hook updates in-memory state first, then tries
    // to persist — so the UI must reflect the new entry even though it won't survive a reload.
    await page.addInitScript(() => {
      const _real = window.localStorage;
      Object.defineProperty(window, "localStorage", {
        get: () => ({
          getItem:    (k: string) => _real.getItem(k),
          setItem:    ()         => { throw new DOMException("QuotaExceededError", "QuotaExceededError"); },
          removeItem: (k: string) => _real.removeItem(k),
          clear:      ()         => _real.clear(),
          get length()           { return _real.length; },
          key:        (i: number) => _real.key(i),
        }),
        configurable: true,
      });
    });

    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");

    // In-memory update still happened — result and history heading must appear
    await expect(page.getByRole("button", { name: /Next/i })).toBeVisible();
    await expect(scoreHistory.heading).toBeVisible();

    // After reload the entry is gone — it was never persisted
    await page.reload();
    await expect(scoreHistory.heading).not.toBeVisible();
  });

  test("app recovers with empty history when stored JSON is corrupted", async ({
    page,
    scoreHistory,
  }) => {
    // Plant corrupted data first, then reload so the hook sees it on mount.
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.setItem("math-trainer-history", "}{not valid json}{")
    );
    await page.reload();

    // JSON.parse throws, caught silently — history falls back to empty array
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Math Trainer");
    await expect(scoreHistory.heading).not.toBeVisible();
  });

  test("clear button removes history from UI even when localStorage.removeItem throws", async ({
    page,
    selectionMenu,
    problemGrid,
    scoreHistory,
  }) => {
    // Submit a session to create a history entry, then sabotage removeItem.
    // clearHistory() calls setHistory([]) first — so the UI must go blank
    // even though the data wasn't removed from storage.
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");
    await expect(scoreHistory.heading).toBeVisible();

    // Override removeItem mid-test (after the page is running)
    await page.evaluate(() => {
      Storage.prototype.removeItem = () => {
        throw new DOMException("SecurityError");
      };
    });

    await scoreHistory.clear();

    // In-memory state cleared — UI must reflect that immediately
    await expect(scoreHistory.heading).not.toBeVisible();

    // On reload the entry comes back — it was never removed from localStorage
    await page.reload();
    await expect(scoreHistory.heading).toBeVisible();
  });
});

// ── Network degradation ───────────────────────────────────────────────────────

test.describe("Chaos — network degradation", () => {
  test("full math flow completes after connection drops mid-session", async ({
    page,
    selectionMenu,
    problemGrid,
    scoreHistory,
  }) => {
    await page.goto("/");

    // Go offline after the app has fully loaded
    await page.context().setOffline(true);

    // The app is a client-side SPA — generate → fill → submit must all work offline
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");

    await expect(page.getByRole("button", { name: /Next/i })).toBeVisible();
    await expect(scoreHistory.heading).toBeVisible();

    await page.context().setOffline(false);
  });

  test("app loads and is usable under Slow-3G conditions (Chromium only)", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    // CDP Network throttling is Chromium-specific
    test.skip(
      test.info().project.name !== "chromium",
      "CDP throttling requires Chromium"
    );

    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline:           false,
      downloadThroughput: (500 * 1024) / 8, // 500 Kbps
      uploadThroughput:   (500 * 1024) / 8,
      latency:            400,               // 400 ms RTT
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Math Trainer"
    );

    // Core flow must still be reachable — all assets should be cached/local
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await expect(problemGrid.inputs).toHaveCount(20);

    await client.send("Network.emulateNetworkConditions", {
      offline:           false,
      downloadThroughput: -1,
      uploadThroughput:   -1,
      latency:            0,
    });
  });
});

// ── Rapid user interaction ────────────────────────────────────────────────────

test.describe("Chaos — rapid user interaction", () => {
  test("rapid mode switching leaves the app in a clean, consistent state", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");

    // Thrash through all four modes in quick succession
    for (const mode of ["addition", "subtraction", "multiplication", "division"] as const) {
      await selectionMenu.selectMode(mode);
    }

    // Final state must be clean — no stale problems from previous modes
    await expect(problemGrid.inputs).toHaveCount(0);
    // The left-digits selector must be visible (mode was set to division)
    await expect(selectionMenu.divisorDigitsLabel).toBeVisible();
  });

  test("clicking Generate repeatedly always produces exactly 20 fresh inputs", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configure("addition", "1", "1");

    // Click Generate four times — each click should replace the set cleanly
    for (let i = 0; i < 4; i++) {
      await selectionMenu.generate();
    }

    await expect(problemGrid.inputs).toHaveCount(20);
    // All inputs must be blank — no leftover answers from prior generations
    await expect(problemGrid.inputs.first()).toHaveValue("");
    await expect(problemGrid.inputs.last()).toHaveValue("");
  });

  test("filling all inputs as fast as possible still enables the Submit button", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    // Fill all 20 inputs sequentially with no deliberate pauses — simulates a
    // fast typist and stresses React's state batching for the Submit gate.
    // (Promise.all is intentionally avoided: concurrent CDP writes cause some
    // React onChange events to be coalesced, dropping answers from state.)
    const inputs = await problemGrid.inputs.all();
    for (const input of inputs) {
      await input.fill("5");
    }

    await expect(problemGrid.submitButton).toBeEnabled();
  });
});
