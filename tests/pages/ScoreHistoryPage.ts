import { type Page, type Locator } from "@playwright/test";

export class ScoreHistoryPage {
  readonly heading: Locator;
  readonly clearButton: Locator;

  constructor(page: Page) {
    this.heading     = page.getByText("Recent Sessions");
    this.clearButton = page.getByRole("button", { name: "Clear", exact: true });
  }

  async clear() {
    await this.clearButton.click();
  }
}
