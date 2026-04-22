import { type Page, type Locator } from "@playwright/test";

const VALUE_TO_LABEL: Record<string, RegExp> = {
  addition:       /addition/i,
  subtraction:    /subtraction/i,
  multiplication: /multiplication/i,
  division:       /division/i,
  "1": /^1 digit/,
  "2": /^2 digit/,
  "3": /^3 digit/,
  "4": /^4 digit/,
};

export type Mode = "addition" | "subtraction" | "multiplication" | "division";
export type Digits = "1" | "2" | "3" | "4";

export class SelectionMenuPage {
  readonly generateButton: Locator;
  readonly leftDigitsLabel: Locator;
  readonly rightDigitsLabel: Locator;
  readonly divisorDigitsLabel: Locator;
  readonly quotientDigitsLabel: Locator;
  readonly sliders: Locator;

  constructor(private readonly page: Page) {
    this.generateButton    = page.getByRole("button", { name: /Generate/i });
    this.leftDigitsLabel   = page.getByText("Left Digits");
    this.rightDigitsLabel  = page.getByText("Right Digits");
    this.divisorDigitsLabel  = page.getByText("Divisor Digits");
    this.quotientDigitsLabel = page.getByText("Quotient Digits");
    this.sliders = page.locator('input[type="range"]');
  }

  async selectMode(mode: Mode) {
    await this._pick(0, mode);
  }

  async selectLeftDigits(digits: Digits) {
    await this._pick(1, digits);
  }

  async selectRightDigits(digits: Digits) {
    await this._pick(2, digits);
  }

  async configure(mode: Mode, left: Digits, right: Digits) {
    await this.selectMode(mode);
    await this.selectLeftDigits(left);
    await this.selectRightDigits(right);
  }

  async generate() {
    await this.generateButton.click();
  }

  async configureAndGenerate(mode: Mode, left: Digits, right: Digits) {
    await this.configure(mode, left, right);
    await this.generate();
  }

  async setSliderValue(index: number, value: number) {
    await this.sliders.nth(index).fill(String(value));
  }

  // Radix Select doesn't use native <select> — open the listbox then click the option.
  // scrollIntoViewIfNeeded is required on mobile: the portal-rendered listbox may
  // position options outside the visible viewport on narrow screens.
  private async _pick(nthCombobox: number, value: string) {
    await this.page.getByRole("combobox").nth(nthCombobox).click();
    const label = VALUE_TO_LABEL[value] ?? new RegExp(value, "i");
    const option = this.page.getByRole("option", { name: label });
    await option.scrollIntoViewIfNeeded();
    await option.click();
  }
}
