import type { Problem } from "@/utils/mathLogic";
import type { HistoryEntry } from "@/hooks/useScoreHistory";

// ── Problem factories ─────────────────────────────────────────────────────────

/**
 * Returns a Problem with sensible defaults (5 + 3 = 8).
 * Override any field for test-specific values.
 */
export function makeProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: 0,
    left: 5,
    right: 3,
    operator: "+",
    answer: 8,
    ...overrides,
  };
}

/**
 * Returns an array of `count` Problems, each with a unique sequential id.
 * Per-problem overrides apply uniformly; use Array.from for heterogeneous sets.
 */
export function makeProblems(
  count: number,
  overrides: Partial<Omit<Problem, "id">> = {}
): Problem[] {
  return Array.from({ length: count }, (_, i) =>
    makeProblem({ id: i, ...overrides })
  );
}

// ── HistoryEntry factories ────────────────────────────────────────────────────

let _entryCounter = 0;

/**
 * Returns a complete HistoryEntry with a unique auto-incrementing id and a
 * current timestamp. Pass overrides to set specific scores, modes, or dates.
 *
 * Also satisfies Omit<HistoryEntry, "id" | "date"> for addEntry() calls —
 * the hook ignores the id/date from its input and generates new values.
 */
export function makeHistoryEntry(
  overrides: Partial<HistoryEntry> = {}
): HistoryEntry {
  return {
    id: String(_entryCounter++),
    date: Date.now(),
    mode: "addition",
    leftDigits: 1,
    rightDigits: 1,
    score: 18,
    total: 20,
    timeMs: 45000,
    ...overrides,
  };
}
