import { test, expect } from "./fixtures";

// All tests in this file target the mobile-viewport project (393 × 851 CSS px,
// no touch emulation). Viewport width is the discriminator — 393 px exercises
// every Tailwind sm: breakpoint branch. The full Pixel 5 project (hasTouch: true)
// is intentionally excluded: Radix Select's pointer-event handling is incompatible
// with Playwright's touch emulation, so interaction tests would time out there.
test.skip(
  ({ viewport }) => !viewport || viewport.width >= 640,
  "Mobile layout and ergonomic tests require a viewport narrower than the sm: breakpoint (640 px)"
);

// ── Layout integrity ──────────────────────────────────────────────────────────

test.describe("Mobile — layout", () => {
  test("no horizontal overflow on the config page", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test("no horizontal overflow after the problem grid is generated", async ({
    page,
    selectionMenu,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test("problem grid renders in a single column (cards stack vertically)", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    // At 393 px the grid is grid-cols-1; adjacent cards must have the same
    // left edge and different top edges.
    const first  = await problemGrid.inputs.nth(0).boundingBox();
    const second = await problemGrid.inputs.nth(1).boundingBox();

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    // Same horizontal position → single-column layout
    expect(first!.x).toBeCloseTo(second!.x, 0);
    // Different vertical position → cards are stacked, not side-by-side
    expect(second!.y).toBeGreaterThan(first!.y);
  });

  test("selection menu controls stack vertically (flex-col below sm breakpoint)", async ({
    page,
    selectionMenu,
  }) => {
    await page.goto("/");
    await selectionMenu.selectMode("addition");
    await selectionMenu.selectLeftDigits("1");
    await selectionMenu.selectRightDigits("1");

    // All three comboboxes must have the same left edge (stacked, not side-by-side)
    const boxes = await Promise.all(
      [0, 1, 2].map((i) =>
        page.getByRole("combobox").nth(i).boundingBox()
      )
    );
    boxes.forEach((b) => expect(b).not.toBeNull());

    const xs = boxes.map((b) => b!.x);
    // Allow 2 px tolerance for border/padding rounding
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(2);
  });
});

// ── Input ergonomics ──────────────────────────────────────────────────────────

test.describe("Mobile — input ergonomics", () => {
  test('problem inputs use type="number" to invoke the numeric keyboard', async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    // All 20 inputs must carry type="number" so mobile browsers present a
    // numeric keypad rather than the full soft keyboard.
    const inputTypes = await problemGrid.inputs.evaluateAll((els) =>
      (els as HTMLInputElement[]).map((el) => el.type)
    );
    expect(inputTypes.every((t) => t === "number")).toBe(true);
  });

  test("primary interactive elements meet the 44 px minimum touch-target height", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    // WCAG 2.5.5 recommends a minimum touch target of 44 × 44 CSS px.
    // Check the actionable controls visible at this stage.
    const targets = [
      page.getByRole("button", { name: /Submit/i }),
      page.getByRole("button", { name: /Reset/i }),
    ];

    for (const locator of targets) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("problem inputs are large enough to tap accurately (min 44 px height)", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    const box = await problemGrid.inputs.first().boundingBox();
    expect(box).not.toBeNull();
    // The input's parent card provides the visual tap area — evaluate the card
    // wrapping the first input rather than the narrow input field itself.
    // The input is a direct child of the card div. Both the input and the card
    // carry .glass-sm, so closest() would match the input itself — use
    // parentElement to reach the actual card container.
    const cardHeight = await problemGrid.inputs
      .first()
      .evaluate((el) => el.parentElement?.getBoundingClientRect().height ?? 0);

    expect(cardHeight).toBeGreaterThanOrEqual(44);
  });
});

// ── Full session flow on mobile ───────────────────────────────────────────────

test.describe("Mobile — full session flow", () => {
  test("complete configure → generate → fill → submit → result flow works on mobile", async ({
    page,
    selectionMenu,
    problemGrid,
    scoreHistory,
  }) => {
    await page.goto("/");

    // Configure and generate using the stacked mobile layout
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await expect(problemGrid.inputs).toHaveCount(20);

    // Fill all inputs and submit
    await problemGrid.fillAndSubmit("5");

    // Result card must be present
    await expect(page.getByRole("button", { name: /Next/i })).toBeVisible();

    // Score history must appear
    await expect(scoreHistory.heading).toBeVisible();
  });

  test("result card and score history are reachable by scrolling on mobile", async ({
    page,
    selectionMenu,
    problemGrid,
    scoreHistory,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");

    // Scroll to the score history section and confirm it becomes visible
    await scoreHistory.heading.scrollIntoViewIfNeeded();
    await expect(scoreHistory.heading).toBeInViewport();
  });

  test("page title and heading are correct on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Math Trainer/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Math Trainer");
  });
});
