import { test, expect } from "./fixtures";

test.describe("Math Trainer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title and header", async ({ page }) => {
    await expect(page).toHaveTitle(/Math Trainer/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Math Trainer");
  });

  test("info modal opens and closes", async ({ infoModal }) => {
    await infoModal.open();
    await expect(infoModal.content).toBeVisible();
    await infoModal.close();
    await expect(infoModal.content).not.toBeVisible();
  });

  test("mode dropdown reveals digit selectors progressively", async ({ selectionMenu }) => {
    await expect(selectionMenu.leftDigitsLabel).not.toBeVisible();

    await selectionMenu.selectMode("addition");
    await expect(selectionMenu.leftDigitsLabel).toBeVisible();
    await expect(selectionMenu.rightDigitsLabel).not.toBeVisible();

    await selectionMenu.selectLeftDigits("2");
    await expect(selectionMenu.rightDigitsLabel).toBeVisible();
  });

  test("generate button appears only when all three dropdowns are filled", async ({ selectionMenu }) => {
    await expect(selectionMenu.generateButton).not.toBeVisible();

    await selectionMenu.selectMode("addition");
    await selectionMenu.selectLeftDigits("1");
    await expect(selectionMenu.generateButton).not.toBeVisible();

    await selectionMenu.selectRightDigits("1");
    await expect(selectionMenu.generateButton).toBeVisible();
  });

  test("generates 20 problems on click", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await expect(problemGrid.inputs).toHaveCount(20);
  });

  test("submit button is disabled until all fields are filled", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await expect(problemGrid.submitButton).toBeDisabled();

    await problemGrid.fillAll("5");
    await expect(problemGrid.submitButton).toBeEnabled();
  });

  test("submit stays disabled with 19 of 20 fields filled", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    await problemGrid.fillN(19, "5");
    await expect(problemGrid.submitButton).toBeDisabled();
  });

  test("reset clears problems and returns to config", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("subtraction", "2", "1");
    await expect(problemGrid.inputs).toHaveCount(20);

    await problemGrid.reset();
    await expect(problemGrid.inputs).toHaveCount(0);
  });

  test("max value sliders appear after digit selection", async ({ selectionMenu }) => {
    await selectionMenu.selectMode("addition");
    await selectionMenu.selectLeftDigits("2");
    await expect(selectionMenu.sliders).toHaveCount(1);

    await selectionMenu.selectRightDigits("2");
    await expect(selectionMenu.sliders).toHaveCount(2);
  });

  test("max value slider updates the displayed max number", async ({ page, selectionMenu }) => {
    await selectionMenu.selectMode("addition");
    await selectionMenu.selectLeftDigits("2");
    await selectionMenu.setSliderValue(0, 50);
    await expect(page.getByText("50")).toBeVisible();
  });

  test("division mode labels show Divisor and Quotient", async ({ selectionMenu }) => {
    await selectionMenu.selectMode("division");
    await expect(selectionMenu.divisorDigitsLabel).toBeVisible();

    await selectionMenu.selectLeftDigits("1");
    await expect(selectionMenu.quotientDigitsLabel).toBeVisible();
  });

  test("division mode generates 20 problems with ÷ operator", async ({ page, selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("division", "1", "1");
    await expect(problemGrid.inputs).toHaveCount(20);
    await expect(page.locator("span").filter({ hasText: /^÷$/ }).first()).toBeVisible();
  });

  test("Enter key advances focus to the next input", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");

    await problemGrid.inputs.nth(0).fill("5");
    await problemGrid.inputs.nth(0).press("Enter");
    await expect(problemGrid.inputs.nth(1)).toBeFocused();
  });

  test("changing mode resets problems and right digit selector", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await expect(problemGrid.inputs).toHaveCount(20);

    await selectionMenu.selectMode("multiplication");
    await expect(problemGrid.inputs).toHaveCount(0);
    await expect(selectionMenu.rightDigitsLabel).not.toBeVisible();
  });

  test("Generate again replaces the problem set with empty inputs", async ({ selectionMenu, problemGrid }) => {
    await selectionMenu.configureAndGenerate("multiplication", "1", "1");

    await problemGrid.inputs.first().fill("42");
    await selectionMenu.generate();

    await expect(problemGrid.inputs).toHaveCount(20);
    await expect(problemGrid.inputs.first()).toHaveValue("");
  });

  test("score history appears after first submission", async ({ selectionMenu, problemGrid, scoreHistory }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");
    await expect(scoreHistory.heading).toBeVisible();
  });

  test("score history persists after page reload", async ({ page, selectionMenu, problemGrid, scoreHistory }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");
    await expect(scoreHistory.heading).toBeVisible();

    await page.reload();
    await expect(scoreHistory.heading).toBeVisible();
  });

  test("clear button removes score history", async ({ selectionMenu, problemGrid, scoreHistory }) => {
    await selectionMenu.configureAndGenerate("addition", "1", "1");
    await problemGrid.fillAndSubmit("5");
    await expect(scoreHistory.heading).toBeVisible();

    await scoreHistory.clear();
    await expect(scoreHistory.heading).not.toBeVisible();
  });
});
