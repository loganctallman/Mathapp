import { type Page, type Locator, expect } from "@playwright/test";

export class ProblemGridPage {
  readonly inputs: Locator;
  readonly submitButton: Locator;
  readonly resetButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.inputs       = page.getByPlaceholder("?");
    this.submitButton = page.getByRole("button", { name: /Submit/i });
    this.resetButton  = page.getByRole("button", { name: /Reset/i });
    this.nextButton   = page.getByRole("button", { name: /Next/i });
  }

  async fillAll(value: string) {
    const count = await this.inputs.count();
    for (let i = 0; i < count; i++) {
      await this.inputs.nth(i).fill(value);
    }
    await expect(this.submitButton).toBeEnabled();
  }

  async fillN(n: number, value: string) {
    for (let i = 0; i < n; i++) {
      await this.inputs.nth(i).fill(value);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async reset() {
    await this.resetButton.click();
  }

  async fillAndSubmit(value: string) {
    await this.fillAll(value);
    await this.submit();
  }
}
