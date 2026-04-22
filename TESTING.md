# Testing Strategy — Math Trainer

This document describes the testing architecture for Math Trainer, a Next.js PWA for mental arithmetic practice. Every layer of the pyramid is covered: unit tests with enforced coverage thresholds, component integration tests, full end-to-end flows using the Page Object Model, automated accessibility scans, pixel-level visual regression, performance baselines, and chaos engineering. The sections below explain not just what is tested but why each decision was made.

---

## Table of Contents

1. [Philosophy and Test Pyramid](#1-philosophy-and-test-pyramid)
2. [Tooling](#2-tooling)
3. [Unit Tests — Pure Logic](#3-unit-tests--pure-logic)
4. [Unit Tests — Hooks](#4-unit-tests--hooks)
5. [Unit Tests — Components](#5-unit-tests--components)
6. [Integration Tests — Page Orchestration](#6-integration-tests--page-orchestration)
7. [Shared Test Factories](#7-shared-test-factories)
8. [Coverage Reporting and Thresholds](#8-coverage-reporting-and-thresholds)
9. [End-to-End Tests — Page Object Model](#9-end-to-end-tests--page-object-model)
10. [End-to-End Tests — Core User Flows](#10-end-to-end-tests--core-user-flows)
11. [Mobile-Specific Tests](#11-mobile-specific-tests)
12. [Accessibility Testing](#12-accessibility-testing)
13. [Visual Regression Testing](#13-visual-regression-testing)
14. [Chaos and Resilience Testing](#14-chaos-and-resilience-testing)
15. [Performance Baselines](#15-performance-baselines)
16. [CI/CD Pipeline](#16-cicd-pipeline)

---

## 1. Philosophy and Test Pyramid

The goal is a suite that catches real defects quickly and fails loudly when it matters, without generating noise that conditions teams to ignore failures.

**Fast, focused unit tests form the base.** Pure functions and React hooks are tested in isolation using Vitest and jsdom. These tests run in under two seconds and give immediate signal on regressions in core logic — digit range calculation, problem generation, slow-answer detection, stopwatch accumulation, and history persistence.

**Component tests sit in the middle.** Each UI component is rendered in isolation with `@testing-library/react`. These tests verify the contract between a component and its props: what renders, what is hidden, what fires when a button is clicked. They do not require a browser or a running server.

**End-to-end tests verify real user journeys.** Playwright drives a production build against Chromium, Firefox, and a Pixel 5 mobile viewport. This layer trusts nothing about internal implementation — it exercises the app exactly as a user would.

**Specialist layers supplement the pyramid.** Axe-core WCAG scans, screenshot regression, Lighthouse performance scoring, and chaos tests for storage and network failures round out the coverage. The informational layers (visual, performance) are explicitly non-blocking in CI — they produce signal without holding up a release.

---

## 2. Tooling

| Concern | Tool | Why |
|---|---|---|
| Unit / component tests | Vitest + jsdom | Native ESM support, Vite-aligned module resolution, `vi.useFakeTimers()` for deterministic hook tests |
| Component rendering | @testing-library/react | Encourages accessible-query-first assertions; `userEvent` accurately simulates real input sequences |
| Coverage | @vitest/coverage-v8 | V8's native instrumentation; no Babel transform overhead; lcov output for third-party ingestion |
| E2E / cross-browser | Playwright | Reliable auto-wait, multi-browser, CDP access for network throttling, built-in screenshot diff |
| Accessibility | @axe-core/playwright | WCAG 2.1 AA automated scanning at the rendered DOM layer — catches what static analysis misses |
| Visual regression | Playwright `toHaveScreenshot` | Sub-pixel tolerant baseline comparison; masks for non-deterministic content |
| Performance | Lighthouse CI (`@lhci/cli`) | Repeatable Core Web Vitals scoring against a production build |

---

## 3. Unit Tests — Pure Logic

### `src/utils/mathLogic.spec.ts` — 13 tests

The generation engine is the foundation of the entire app. If `generateProblems` produces a wrong answer, every correctness check downstream is compromised. These tests exercise the contract exhaustively before any React rendering occurs.

**`digitMin` / `digitMax`** — Four boundary tests each verify that the digit-to-range conversion is correct for 1–4 digit counts. Off-by-one errors here would silently produce out-of-range operands.

**`generateProblems`** — The bulk of the tests target answer correctness for all four modes (addition, subtraction, multiplication, division), the default count of 20, custom counts, sequential ID assignment, and the `leftMax`/`rightMax` cap options. The subtraction test explicitly asserts non-negative answers — the generator guarantees `left >= right` and this test pins that invariant so a future refactor cannot silently break it. The division test asserts `Number.isInteger(answer)` because the generator constructs dividends from whole-number products; any regression to floating-point division would surface here immediately.

### `src/utils/scoring.spec.ts` — 6 tests

`computeSlowIndices` was extracted from `page.tsx` as a pure function specifically to make it testable. The algorithm identifies answers whose inter-keystroke gap exceeds twice the median gap — a relative measure that adapts to each user's pace. The tests cover:

- **Early return guard** — fewer than three answered problems returns an empty set to avoid statistical noise on incomplete data.
- **No-outlier case** — uniform gaps produce no slow indices.
- **Outlier detection** — a single answer with a gap three times larger than peers is correctly flagged.
- **Gap-from-start** — the first problem's gap is measured from the session start timestamp, not from zero, preventing the first answer from being incorrectly penalised.
- **Null handling** — unanswered (null) problems are excluded from timing without shifting the indices of subsequent answers.
- **Out-of-order preservation** — answers arriving in non-sequential order are sorted by timestamp for gap calculation, but the *original array index* is returned in the result set. This is the subtlest invariant in the algorithm and the most likely to regress.

---

## 4. Unit Tests — Hooks

### `src/hooks/useStopwatch.spec.ts` — 15 tests

**`formatTime`** — Seven boundary tests cover zero, tenths of a second, single-digit seconds (zero-padding), whole minutes, minutes-with-seconds-and-tenths, and double-digit minutes. These may look trivial, but format regressions are highly visible to users and easy to introduce with arithmetic refactors.

**`useStopwatch`** — The hook manages a `setInterval` ref and accumulated elapsed time. Testing it requires fake timers — real-time tests would be slow and flaky. The setup pattern is:

```typescript
vi.useFakeTimers();
vi.setSystemTime(0);
// ... test body using vi.advanceTimersByTime()
vi.useRealTimers(); // restored in afterEach
```

Eight behavioral tests verify: initial state, `start()` setting `running: true`, elapsed advancing at 100 ms per tick, `stop()` freezing elapsed with the interval cleared, `reset()` returning to zero, `reset()` while running not resuming after further ticks, idempotent `start()` (calling twice does not double-count), and **stop → start resuming from the paused position**. The resume test is the most important — the hook accumulates elapsed across multiple start/stop cycles, and this test pins that accumulated-total semantics are preserved.

### `src/hooks/useScoreHistory.spec.ts` — 7 tests

The history hook manages both in-memory React state and `localStorage` persistence. Tests use a real `localStorage` (available in jsdom) cleared in `beforeEach` to ensure isolation.

Coverage spans: empty initial state, `addEntry` prepending a new entry, the 10-entry cap (over-submission is silently truncated), `clearHistory` emptying the array, persistence to `localStorage`, `clearHistory` removing the key, and **hydration on mount** — the async `waitFor` test confirms the hook reads persisted data after re-render, which is the most operationally significant behaviour (data must survive a browser tab close).

---

## 5. Unit Tests — Components

All component tests use `@testing-library/react` with accessible queries (`getByRole`, `getByText`, `getByPlaceholderText`) rather than class selectors or `data-testid` attributes. This ensures tests break when accessibility contracts break, not just when implementation details change.

### `src/components/ProblemItem.spec.tsx` — 7 tests

The atomic unit of the problem grid. Tests cover: operand and operator rendering, the correct-answer (✓) path, the wrong-answer (✗ + correct value) path, input disabled state after submission, `onEnterKey` firing on Enter press, and the slow-indicator appearing only when `isSlow=true` AND the input has a value (an empty input should never show a "Took a while" badge).

### `src/components/ProblemList.spec.tsx` — 8 tests

The problem grid's container, which owns the Submit gate. The critical tests are: Submit disabled with empty answers, Submit enabled with all answers filled, score pill appearing post-submission, Submit replaced by Next after submission (this button swap is a common source of regression), and the elapsed timer rendering only when `elapsed > 0`.

### `src/components/ResultCard.spec.tsx` — 7 tests

Three distinct message branches (Perfect / Good work / Keep practicing) are tested with explicit score boundaries. The 70% threshold is a product decision — tests pin it so a future refactor does not silently shift it. The time display is tested both present (when `timeMs > 0`) and absent (when `timeMs === 0`) to prevent a zero-time card from showing "0:00.0".

### `src/components/ScoreHistory.spec.tsx` — 8 tests

The history component renders nothing when the array is empty (empty DOM, not an empty list). Tests verify operator symbol rendering for all four modes, and the three colour-coded score classes — yellow for perfect, green for passing, red for failing. The "Today" relative-date test confirms the date formatter is working without needing to mock `Date.now()`.

### `src/components/SelectionMenu.spec.tsx` — 7 tests

The progressive-disclosure UI is the most stateful component. Tests verify the three-step reveal (mode → left digits → right digits), the Generate button appearing only when all three selections are complete, division mode showing "Divisor"/"Quotient" labels instead of the generic "Left"/"Right", `onGenerate` firing on click, and the max-value slider rendering and reflecting its current value.

### `src/components/InfoModal.spec.tsx` — 5 tests

The modal's open/close contract: hidden initially, opens on trigger click, closes on close button, and closes on backdrop click. The backdrop test uses `document.querySelector` because the fixed overlay is not reachable through a semantic role — this is documented in the test as an explicit implementation-detail query.

---

## 6. Integration Tests — Page Orchestration

### `src/app/page.spec.tsx` — 10 tests

`page.tsx` is the orchestration layer: it wires together all hooks and passes callbacks between components. Testing it in jsdom requires isolating external dependencies that would either fail or produce non-deterministic output.

**Mocking strategy:**

- `generateProblems` is replaced with a deterministic stub returning 20 problems where every answer is `8` (5 + 3). This eliminates randomness from all correctness assertions.
- `useStopwatch` is replaced with spy functions (`mockStart`, `mockStop`, `mockReset`) while the real `formatTime` is preserved. This lets tests assert the stopwatch's lifecycle without managing real timers in this layer — the hook's own spec already covers timer behaviour in depth.
- `InstallPrompt` and `InfoModal` are stubbed to `null` because they rely on browser APIs (`beforeinstallprompt`, `matchMedia`) not available in jsdom.
- `SelectionMenu` is replaced with simple `<button>` elements that directly invoke the passed callbacks, eliminating the Radix Select dependency from this test layer.

The `vi.hoisted()` pattern is used to define `MOCK_PROBLEMS` before Vitest's module hoisting runs `vi.mock()` factory functions. Without `vi.hoisted()`, the factory captures an uninitialized reference.

**Tests of note:**

- **Stopwatch start-on-first-keystroke** — `mockStart` must be called exactly once after the first `onChange` event and not again on subsequent inputs. This pins a specific integration contract between the input handler and the hook.
- **localStorage persistence** — After submit, the raw `localStorage` entry is inspected to confirm the shape of the persisted object (`score`, `total`, `mode`). This decouples the test from the `ScoreHistory` component's rendering.
- **Partial score** — 15 correct + 5 wrong answers produce `{ score: 15, total: 20 }` in storage.

---

## 7. Shared Test Factories

### `src/test/factories.ts`

Fixture duplication across spec files is a maintenance liability: when a type changes, every inline definition needs to be updated. More subtly, specs that define their own data objects silently diverge from each other — one file uses `score: 18`, another uses `score: 20`, and a reader can no longer tell which value is semantically meaningful versus incidental.

`factories.ts` centralises the two domain-model fixtures used across multiple files:

**`makeProblem(overrides?)`** — Returns a `Problem` with defaults `{ id: 0, left: 5, right: 3, operator: "+", answer: 8 }`. Test-specific values are passed as overrides: `makeProblem({ left: 12, right: 5, answer: 17 })` makes the intent explicit ("this test cares about these specific operands") rather than hiding it in a const at the top of the file. Used by `ProblemItem.spec.tsx` and `ProblemList.spec.tsx`.

**`makeProblems(count, overrides?)`** — Returns an array of `count` Problems with sequential ids. The common override pattern is `Array.from({ length: n }, (_, i) => makeProblem({ id: i, left: i + 1, ... }))` for tests that need distinct operand values per problem.

**`makeHistoryEntry(overrides?)`** — Returns a complete `HistoryEntry` with a unique auto-incrementing id and a current timestamp. The counter is module-scoped so parallel calls within a single test always produce distinct ids without manual management. Used by `ScoreHistory.spec.tsx` (component rendering with full `HistoryEntry`) and `useScoreHistory.spec.ts` (hook calls via `addEntry`, which accepts `Omit<HistoryEntry, "id" | "date">` — a `HistoryEntry` satisfies this structurally since the extra fields are ignored by the hook).

**Why `page.spec.tsx` does not use the factory** — `MOCK_PROBLEMS` is defined inside `vi.hoisted()`, which runs before ESM imports are evaluated. The factory module is not yet available at that point. The array is defined inline with a comment explaining the constraint; its shape is identical to what `makeProblem()` would produce, so any drift between the two would be caught by TypeScript.

---

## 8. Coverage Reporting and Thresholds

Coverage is collected with V8's native instrumentation and reported in three formats: terminal text for immediate feedback, HTML for local browsing, and lcov for CI artifact ingestion.

**Thresholds** (enforced — CI fails if breached):

| Metric | Threshold |
|---|---|
| Statements | 90% |
| Branches | 88% |
| Functions | 85% |
| Lines | 90% |

These thresholds were calibrated against the actual coverage profile after all unit tests were written — they reflect what the suite genuinely covers, not an aspirational number. Setting thresholds below actual coverage is the only way to make them meaningful; a threshold you never fail is not a guard rail.

**Exclusions are explicit and justified:**

- `src/app/layout.tsx`, `src/app/manifest.ts` — Next.js boilerplate with no testable logic
- `src/components/InstallPrompt.tsx`, `src/components/ServiceWorkerRegistrar.tsx` — depend on browser APIs (`beforeinstallprompt`, `navigator.serviceWorker`) that are unavailable in jsdom; coverage is provided by e2e tests against a real browser

---

## 9. End-to-End Tests — Page Object Model

All Playwright tests consume four fixture-injected page objects rather than raw `page` locators. The fixtures are defined in `tests/fixtures.ts` using Playwright's `base.extend<AppFixtures>()` pattern:

```
tests/
  fixtures.ts           — fixture wiring
  pages/
    SelectionMenuPage.ts
    ProblemGridPage.ts
    ScoreHistoryPage.ts
    InfoModalPage.ts
```

**Why POM matters here.** The configuration UI uses Radix UI's `<Select>` component, which is not a native `<select>`. It renders a `[role="combobox"]` trigger that opens a floating `[role="listbox"]` portal — the interaction requires two separate clicks. Every e2e test that configures the app would need to know this. The POM encapsulates it in `SelectionMenuPage._pick()` so tests express intent (`selectMode("division")`) rather than implementation detail.

The same principle applies to `ProblemGridPage.fillAndSubmit()`, which fills all inputs sequentially — not with `Promise.all` — because concurrent CDP `fill` commands cause React 18's event batching to coalesce some `onChange` events, dropping answers from state and leaving the Submit button disabled. This is a known framework interaction that would be rediscovered by every engineer who wrote a parallel fill. Encapsulating it in the POM documents the fix once.

**Fixture injection** means each test declares its dependencies by name, and Playwright constructs and tears down the page objects per test. There is no shared mutable fixture state between tests.

---

## 10. End-to-End Tests — Core User Flows

### `tests/math-trainer.spec.ts` — 18 tests

Tests run against Chromium, Firefox, and Pixel 5 (mobile Chrome) in parallel.

**Progressive disclosure** — Three tests verify the step-by-step reveal of the configuration UI. Mode selection reveals the left-digit selector; left-digit selection reveals the right-digit selector; all three filled reveals Generate. This is the primary onboarding flow and a common target for CSS-driven conditional-rendering regressions.

**Submit gate** — Two tests cover the boundary: 20 of 20 fields filled (enabled) and 19 of 20 (still disabled). The off-by-one case is explicit because gating on `answers.every(a => a !== "")` is exactly the kind of condition where a developer might substitute `some` for `every` during a refactor.

**Mode-change reset** — Switching modes while a problem set is active should clear both the problems and the right-digit selection. This tests a non-obvious state reset path that exists to prevent showing problems from one mode while configuration shows a different mode.

**Regeneration** — Clicking Generate a second time replaces the problem set with blank inputs. A pre-filled value is written before regeneration to confirm existing answers do not persist.

**Score history persistence** — Three tests cover the full lifecycle: history appears after the first submission, persists across a page reload (read from `localStorage`), and is removed when the Clear button is clicked.

---

## 11. Mobile-Specific Tests

### `tests/mobile.spec.ts` — 10 tests

Tests run exclusively under the `mobile-viewport` project: standard Chromium with a 393 × 851 px viewport and no touch emulation. The `test.skip` guard uses `viewport.width >= 640` (the Tailwind `sm:` breakpoint) as the discriminator — tests are skipped automatically on the 1280 px desktop projects.

**Why `mobile-viewport` instead of `mobile-chrome` (Pixel 5)?** Radix Select's `onPointerDown` handler does not fire in Playwright's full touch-emulation context (`hasTouch: true`). The listbox never opens, and every interaction test times out. The `mobile-viewport` project provides genuine 393 px CSS layout coverage while keeping pointer events intact for Radix. The `mobile-chrome` Pixel 5 project continues to run all other test files (math-trainer, chaos, accessibility) — it is not removed, because it validates that the app loads and functions at the Pixel 5 user-agent and viewport without depending on Radix interactions.

**Layout integrity (4 tests)** — No horizontal overflow in the initial config state or after generating problems. The problem grid is single-column (`grid-cols-1`) at 393 px — verified by checking that adjacent input cards share the same X coordinate. The selection menu controls stack vertically (`flex-col`) — all three comboboxes must share the same left edge within a 2 px tolerance.

**Input ergonomics (3 tests)** — All 20 problem inputs carry `type="number"`, which triggers a numeric keypad on real mobile browsers. Submit and Reset buttons meet the WCAG 2.5.5 minimum touch-target height of 44 px. Problem input cards also meet the 44 px minimum — one real violation was found and fixed: the cards were 30 px tall. Fixed by adding `min-h-[44px]` to `ProblemItem`'s card class.

**Full session flow (3 tests)** — Complete configure → generate → fill → submit → result at 393 px. The result card and score history section are reachable by scrolling (`scrollIntoViewIfNeeded` + `toBeInViewport`). Page title and h1 are correct.

---

## 12. Accessibility Testing


### `tests/accessibility.spec.ts` — 12 tests

Accessibility is tested at two levels: automated WCAG scanning and explicit structural assertions.

**Axe automated scans (5 tests)**

`AxeBuilder({ page }).analyze()` runs the full axe-core rule set against five distinct application states: initial config, problem grid, post-submit result, info modal open, and division mode. Testing multiple states is important because dynamic content (dialog overlays, conditionally rendered controls) introduces accessibility surface area that a single static scan cannot exercise. All five states must produce zero violations — a non-empty `violations` array fails the test.

These scans were run before the test suite was written and revealed three real violations that were fixed prior to committing:

1. Radix Select triggers had no accessible name — fixed by adding `aria-label` to `<Select.Trigger>`.
2. Range sliders had no accessible name — fixed by adding `aria-label` to each `<Slider.Root>`.
3. The info modal's heading was `<h3>` inside a `<div>` with no dialog role — fixed by promoting to `<h2>` and adding `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.

**ARIA structural assertions (4 tests)**

Automated scanners verify presence but not correctness of semantic relationships. These tests go further:

- Comboboxes are queried by their `aria-label` values to confirm the labels are not just present but accurate and match what a screen reader would announce.
- Sliders are queried by accessible name for the same reason.
- The dialog test retrieves `aria-labelledby`, resolves the ID to a DOM element, and asserts that element is visible — confirming the label reference is not dangling.
- The heading hierarchy test asserts `h1 → h2` with no `h3` elements in the document, preventing level-skipping that disorients screen reader navigation.

**Keyboard navigation (3 tests)**

- The info button is reachable by Tab and activatable by Enter.
- Enter in a problem input advances focus to the next input (sequential keyboard flow through the problem grid).
- Tab from the first input moves focus to the second input (natural document order is intact).

---

## 13. Visual Regression Testing

### `tests/visual.spec.ts` — 6 tests

Visual tests run on Chromium only. Firefox and mobile viewports produce sub-pixel anti-aliasing differences in font rendering that would generate false positives on every run. The `test.skip` guard at the describe level enforces this.

```typescript
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Visual baselines are Chromium-only"
);
```

`reducedMotion: "reduce"` is applied in `beforeEach` to disable CSS transitions and animations, ensuring screenshots are taken of stable final states rather than in-progress transitions.

**Masking strategy**

Deterministic states (initial config, complete config, modal open) require no masking — the same content renders on every run.

Post-interaction states contain non-deterministic content that must be masked:

- `span.font-mono.tabular-nums` — the running timer changes every run
- `div.grid.gap-3` — after submission, the problem grid shows `✗ <correct_answer>` labels whose values are random per-run

Both masks are applied together in the result-card and score-history screenshots. Missing the grid mask was the initial failure mode: the timer mask alone left ~22% pixel variance from random correct answers appearing in feedback cells.

**Scroll normalization**

`await page.evaluate(() => window.scrollTo(0, 0))` is called before each post-interaction screenshot. Filling 20 inputs causes the browser to scroll to the active input; without explicit scroll reset, baselines captured in one run may differ in viewport position from the next run, producing large pixel diffs that have nothing to do with visual regressions.

**Pixel tolerance**

The global `maxDiffPixelRatio: 0.02` in `playwright.config.ts` absorbs sub-pixel GPU rendering differences between local macOS and CI Ubuntu without allowing meaningful layout changes to pass undetected.

**CI posture** — Visual tests run in a dedicated `visual` job with `continue-on-error: true`. Failures appear as a visible warning in the PR check list but never block a deploy. Baselines are regenerated with `--update-snapshots` when intentional visual changes are made.

---

## 14. Chaos and Resilience Testing

### `tests/chaos.spec.ts` — 9 tests

Math Trainer is a client-side PWA with no server dependency during a session. The resilience tests verify that storage failures and network conditions do not crash the app or silently corrupt state.

**localStorage failure modes (4 tests)**

Browser storage is not reliable. Private browsing blocks it with `SecurityError`; storage quotas can be exceeded mid-session; persisted JSON can be corrupted by external writes. These failure modes are simulated at the API level, not by mocking application code.

- **Fully blocked storage** — `page.addInitScript()` overrides `window.localStorage` before the app initialises, causing every access to throw `DOMException("SecurityError")`. The app must render without crashing and gracefully show no history.
- **Quota exceeded** — `getItem` is left functional (reads work), but `setItem` throws `QuotaExceededError`. The hook updates in-memory React state first and then attempts persistence; the result card and history heading must appear despite the failed write. After reload, the entry must be absent — it was never persisted.
- **Corrupted JSON** — `"}{not valid json}{"` is planted in `localStorage` before reload. `JSON.parse` throws; the hook catches it silently and initialises to an empty array.
- **`removeItem` throws** — The Clear button calls `setHistory([])` (in-memory update) before calling `localStorage.removeItem`. The UI must go blank immediately. On reload, the entry returns — it was never removed from storage. This test verifies both that the in-memory update is not blocked by the storage failure AND that the persistent state correctly reflects what the storage layer actually recorded.

`page.addInitScript()` is used for pre-load overrides because the script runs before any application JavaScript, allowing a real `window.localStorage` reference to be captured before the property getter is replaced. `page.evaluate()` is used for mid-test overrides (`Storage.prototype.removeItem`) that need to take effect after the page has initialised.

**Network degradation (2 tests)**

- **Offline mid-session** — `page.context().setOffline(true)` is called after the app loads. The full configure → fill → submit flow must complete. As a static SPA, all assets are already in browser cache; this test guards against any inadvertent network calls introduced during feature development.
- **Slow-3G** — CDP's `Network.emulateNetworkConditions` (500 Kbps, 400 ms RTT) is applied before navigation. The app must load, render its heading, and allow problem generation. This test is explicitly skipped on Firefox and WebKit — CDP is Chromium-only.

**Rapid user interaction (3 tests)**

- **Mode thrashing** — All four modes are selected in rapid succession. The final state must be consistent: no stale problems, correct labels visible for the last mode selected.
- **Repeated Generate** — Generate is clicked four times consecutively. Each click must replace the problem set cleanly; no stale problems or leftover answers.
- **Fast typing** — All 20 inputs are filled as fast as Playwright can dispatch events (no artificial delays). Inputs are filled sequentially rather than with `Promise.all` because concurrent CDP writes cause React's event batching to coalesce `onChange` events, dropping answers from state. This is a React 18 batching characteristic, not a test flakiness issue — the test documents the correct fill strategy.

---

## 15. Performance Baselines

Lighthouse CI runs against a production build (`npm run build && npm start`) on every push. The `.lighthouserc.cjs` configuration executes three audit runs and averages the results to reduce per-run variance.

**Assertion thresholds (error level):**

| Metric | Threshold |
|---|---|
| Performance score | ≥ 0.8 |
| Accessibility score | ≥ 0.9 |
| Best Practices score | ≥ 0.9 |
| SEO score | ≥ 0.8 |
| First Contentful Paint | ≤ 2 s |
| Largest Contentful Paint | ≤ 3.5 s |
| Total Blocking Time | ≤ 300 ms |
| Cumulative Layout Shift | ≤ 0.1 |
| Time to Interactive | ≤ 4 s |

**CI posture** — The `performance` job runs in parallel with `e2e` and deploys, with `continue-on-error: true`. A Lighthouse regression surfaces as a visible warning on the PR without blocking release. The threshold values are set to represent the current baseline; they should be tightened as the app improves, never loosened.

---

## 16. CI/CD Pipeline

### Jobs

```
push / PR
├── unit-test        (Vitest + coverage, must pass to deploy)
├── e2e              (Playwright, Chromium + Firefox, must pass to deploy)
├── visual           (Playwright, Chromium only, informational)
├── performance      (Lighthouse CI, informational)
└── deploy           (Vercel, runs only after unit-test + e2e pass)
```

**`unit-test`** — Runs `npm run test:coverage`, enforcing the threshold configuration in `vitest.config.ts`. The coverage artifact is uploaded for every run (including failures) to enable trend tracking.

**`e2e`** — Runs all Playwright tests except `visual.spec.ts`, which has its own job. Visual tests are excluded here to prevent their longer runtime from inflating the deployment gate.

**`visual`** — Chromium only, `continue-on-error: true`. Baselines are committed to `tests/__snapshots__/`. A failure here indicates an intentional or unintentional visual change that requires human review.

**`performance`** — Starts the production server, waits for readiness with `wait-on`, then runs `lhci autorun`. `continue-on-error: true`.

**`deploy`** — Depends on `unit-test` and `e2e`. Runs on both pushes to `main` (production deploy) and same-repo PRs (preview deploy). Fork PRs do not trigger deploy due to secret access restrictions.

**WebServer alignment** — `playwright.config.ts` uses `process.env.CI ? "npm start" : "npm run build && npm start"`. In CI the production build is pre-built by a prior workflow step; Playwright simply starts the already-built server. Locally, a cold `npx playwright test` triggers a fresh production build before starting the server, so e2e tests run against the same bundle as CI. If port 3000 is already occupied (e.g. a running dev server), it is reused — stop the dev server for full alignment. A `timeout: 120_000` accommodates the build time on a cold local start.

**Retry policy** — `retries: 2` in CI prevents single-flake failures from blocking deployment, while still failing a test that consistently fails across three attempts. Local runs use `retries: 0` to surface problems immediately without masking them.
