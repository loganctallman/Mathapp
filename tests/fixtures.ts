import { test as base } from "@playwright/test";
import { SelectionMenuPage } from "./pages/SelectionMenuPage";
import { ProblemGridPage } from "./pages/ProblemGridPage";
import { ScoreHistoryPage } from "./pages/ScoreHistoryPage";
import { InfoModalPage } from "./pages/InfoModalPage";

type AppFixtures = {
  selectionMenu: SelectionMenuPage;
  problemGrid:   ProblemGridPage;
  scoreHistory:  ScoreHistoryPage;
  infoModal:     InfoModalPage;
};

export const test = base.extend<AppFixtures>({
  selectionMenu: async ({ page }, use) => use(new SelectionMenuPage(page)),
  problemGrid:   async ({ page }, use) => use(new ProblemGridPage(page)),
  scoreHistory:  async ({ page }, use) => use(new ScoreHistoryPage(page)),
  infoModal:     async ({ page }, use) => use(new InfoModalPage(page)),
});

export { expect } from "@playwright/test";
