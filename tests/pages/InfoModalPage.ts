import { type Page, type Locator } from "@playwright/test";

export class InfoModalPage {
  readonly infoButton: Locator;
  readonly content: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.infoButton  = page.getByRole("button", { name: "Info" });
    this.content     = page.getByText("Master your mental math");
    this.closeButton = page.getByRole("button", { name: "Close" });
  }

  async open() {
    await this.infoButton.click();
  }

  async close() {
    await this.closeButton.click();
  }
}
