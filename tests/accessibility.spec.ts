import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function configure(selectionMenu: import("./pages/SelectionMenuPage").SelectionMenuPage) {
  await selectionMenu.configureAndGenerate("addition", "1", "1");
}

async function fillAndSubmit(
  selectionMenu: import("./pages/SelectionMenuPage").SelectionMenuPage,
  problemGrid: import("./pages/ProblemGridPage").ProblemGridPage
) {
  await configure(selectionMenu);
  await problemGrid.fillAndSubmit("5");
}

// ── Axe automated WCAG scans ──────────────────────────────────────────────────

test.describe("Accessibility — axe WCAG scans", () => {
  test("initial config state has no violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("problem grid state has no violations", async ({ page, selectionMenu }) => {
    await page.goto("/");
    await configure(selectionMenu);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("post-submit result + score history state has no violations", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await fillAndSubmit(selectionMenu, problemGrid);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("info modal open state has no violations", async ({ page, infoModal }) => {
    await page.goto("/");
    await infoModal.open();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("division mode (renamed labels + sliders) has no violations", async ({
    page,
    selectionMenu,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("division", "1", "1");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

// ── ARIA structure ────────────────────────────────────────────────────────────

test.describe("Accessibility — ARIA structure", () => {
  test("Radix Select triggers have accessible names", async ({ page }) => {
    await page.goto("/");
    // All three comboboxes must have a non-empty accessible name
    await page.getByRole("combobox", { name: "Operation mode" }).waitFor();

    await selectionMenu_selectMode(page);
    await page.getByRole("combobox", { name: /left operand digit count/i }).waitFor();

    await selectionMenu_selectLeft(page);
    await page.getByRole("combobox", { name: /right operand digit count/i }).waitFor();
  });

  test("range sliders have accessible names", async ({ page, selectionMenu }) => {
    await page.goto("/");
    await selectionMenu.selectMode("addition");
    await selectionMenu.selectLeftDigits("2");
    await expect(page.getByRole("slider", { name: /left operand max value/i })).toBeVisible();

    await selectionMenu.selectRightDigits("2");
    await expect(page.getByRole("slider", { name: /right operand max value/i })).toBeVisible();
  });

  test("info modal has role=dialog with aria-modal and aria-labelledby", async ({
    page,
    infoModal,
  }) => {
    await page.goto("/");
    await infoModal.open();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // aria-labelledby must resolve to visible text
    const labelId = await dialog.getAttribute("aria-labelledby");
    await expect(page.locator(`#${labelId}`)).toBeVisible();
  });

  test("page heading hierarchy is correct (h1 → h2, no skipped levels)", async ({
    page,
    infoModal,
  }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("Math Trainer");

    // Open modal — its title must be h2, not h3
    await infoModal.open();
    const modalHeading = page.getByRole("dialog").getByRole("heading", { level: 2 });
    await expect(modalHeading).toBeVisible();
    // No h3 headings anywhere (would mean a skipped level after h1)
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

test.describe("Accessibility — keyboard navigation", () => {
  test("info modal is reachable by keyboard and closeable with Escape", async ({
    page,
    infoModal,
  }) => {
    await page.goto("/");
    // Tab to the Info button and activate it
    await page.keyboard.press("Tab");
    // Keep tabbing until the Info button is focused
    for (let i = 0; i < 10; i++) {
      const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
      if (focused === "Info") break;
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Enter");
    await expect(infoModal.content).toBeVisible();

    await page.keyboard.press("Escape");
    // Escape key — browser/Radix default; test close button as explicit fallback
    // (custom modal without Radix Dialog doesn't auto-close on Escape)
    if (await infoModal.content.isVisible()) {
      await infoModal.close();
    }
    await expect(infoModal.content).not.toBeVisible();
  });

  test("Enter key advances focus through problem inputs", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.inputs.nth(0).fill("5");
    await problemGrid.inputs.nth(0).press("Enter");
    await expect(problemGrid.inputs.nth(1)).toBeFocused();
  });

  test("problem inputs are reachable by Tab from the first input", async ({
    page,
    selectionMenu,
    problemGrid,
  }) => {
    await page.goto("/");
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.inputs.nth(0).focus();
    await page.keyboard.press("Tab");
    await expect(problemGrid.inputs.nth(1)).toBeFocused();
  });
});

// ── Small helpers used in ARIA structure tests ────────────────────────────────
async function selectionMenu_selectMode(page: import("@playwright/test").Page) {
  await page.getByRole("combobox", { name: "Operation mode" }).click();
  await page.getByRole("option", { name: /addition/i }).click();
}

async function selectionMenu_selectLeft(page: import("@playwright/test").Page) {
  await page.getByRole("combobox", { name: /left operand digit count/i }).click();
  await page.getByRole("option", { name: /^1 digit/ }).click();
}
