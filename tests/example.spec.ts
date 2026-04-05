import { test, expect } from "@playwright/test";

// Helper: fill all 20 inputs and wait for Submit to become enabled
async function fillAndEnableSubmit(page: ReturnType<typeof test.info>["project"] extends infer _ ? any : never, value: string) {
  const inputs = page.getByPlaceholder("?");
  const submit = page.getByRole("button", { name: /Submit/i });
  for (let i = 0; i < 20; i++) {
    await inputs.nth(i).fill(value);
  }
  // Wait for React to batch all 20 state updates before proceeding
  await expect(submit).toBeEnabled();
  return { inputs, submit };
}

test.describe("Math Trainer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title and header", async ({ page }) => {
    await expect(page).toHaveTitle(/Math Trainer/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Math Trainer");
  });

  test("info modal opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Info" }).click();
    await expect(page.getByText("Master your mental math")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("Master your mental math")).not.toBeVisible();
  });

  test("mode dropdown reveals digit selectors progressively", async ({ page }) => {
    await expect(page.getByText("Left Digits")).not.toBeVisible();

    await page.getByRole("combobox").first().selectOption("addition");
    await expect(page.getByText("Left Digits")).toBeVisible();
    await expect(page.getByText("Right Digits")).not.toBeVisible();

    await page.getByRole("combobox").nth(1).selectOption("2");
    await expect(page.getByText("Right Digits")).toBeVisible();
  });

  test("generate button appears only when all three dropdowns are filled", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Generate/i })).not.toBeVisible();

    await page.getByRole("combobox").first().selectOption("addition");
    await page.getByRole("combobox").nth(1).selectOption("1");
    await expect(page.getByRole("button", { name: /Generate/i })).not.toBeVisible();

    await page.getByRole("combobox").nth(2).selectOption("1");
    await expect(page.getByRole("button", { name: /Generate/i })).toBeVisible();
  });

  test("generates 20 problems on click", async ({ page }) => {
    await page.getByRole("combobox").first().selectOption("addition");
    await page.getByRole("combobox").nth(1).selectOption("1");
    await page.getByRole("combobox").nth(2).selectOption("1");
    await page.getByRole("button", { name: /Generate/i }).click();

    await expect(page.getByPlaceholder("?")).toHaveCount(20);
  });

  test("submit button is disabled until all fields are filled", async ({ page }) => {
    await page.getByRole("combobox").first().selectOption("addition");
    await page.getByRole("combobox").nth(1).selectOption("1");
    await page.getByRole("combobox").nth(2).selectOption("1");
    await page.getByRole("button", { name: /Generate/i }).click();

    const submit = page.getByRole("button", { name: /Submit/i });
    await expect(submit).toBeDisabled();

    const inputs = page.getByPlaceholder("?");
    for (let i = 0; i < 20; i++) {
      await inputs.nth(i).fill("5");
    }
    await expect(submit).toBeEnabled();
  });

  test("reset clears problems and returns to config", async ({ page }) => {
    await page.getByRole("combobox").first().selectOption("subtraction");
    await page.getByRole("combobox").nth(1).selectOption("2");
    await page.getByRole("combobox").nth(2).selectOption("1");
    await page.getByRole("button", { name: /Generate/i }).click();
    await expect(page.getByPlaceholder("?")).toHaveCount(20);

    await page.getByRole("button", { name: /Reset/i }).click();
    await expect(page.getByPlaceholder("?")).toHaveCount(0);
  });

  test("max value sliders appear after digit selection", async ({ page }) => {
    await page.getByRole("combobox").first().selectOption("addition");
    await page.getByRole("combobox").nth(1).selectOption("2");

    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(1);

    await page.getByRole("combobox").nth(2).selectOption("2");
    await expect(sliders).toHaveCount(2);
  });

  test("division mode labels show Divisor and Quotient", async ({ page }) => {
    await page.getByRole("combobox").first().selectOption("division");
    await expect(page.getByText("Divisor Digits")).toBeVisible();

    await page.getByRole("combobox").nth(1).selectOption("1");
    await expect(page.getByText("Quotient Digits")).toBeVisible();
  });

  test("score history appears after first submission", async ({ page }) => {
    await page.getByRole("combobox").first().selectOption("addition");
    await page.getByRole("combobox").nth(1).selectOption("1");
    await page.getByRole("combobox").nth(2).selectOption("1");
    await page.getByRole("button", { name: /Generate/i }).click();

    const { submit } = await fillAndEnableSubmit(page, "5");
    await submit.click();

    await expect(page.getByText("Recent Sessions")).toBeVisible();
  });
});
