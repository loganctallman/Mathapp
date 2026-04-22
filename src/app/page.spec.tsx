import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page";

// ── Deterministic problems: every answer is 8 (5 + 3) ────────────────────────
// vi.hoisted() runs before ESM imports are evaluated, so the shared makeProblem
// factory from @/test/factories is not yet available here. The array is defined
// inline; the shape is identical to what makeProblem() would produce.
const { MOCK_PROBLEMS } = vi.hoisted(() => ({
  MOCK_PROBLEMS: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    left: 5,
    right: 3,
    operator: "+",
    answer: 8,
  })),
}));

vi.mock("@/utils/mathLogic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/mathLogic")>();
  return { ...actual, generateProblems: vi.fn().mockReturnValue(MOCK_PROBLEMS) };
});

// ── Spy on stopwatch so we can assert .start() was called ─────────────────────
const mockStart = vi.fn();
const mockStop  = vi.fn();
const mockReset = vi.fn();

vi.mock("@/hooks/useStopwatch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useStopwatch")>();
  return {
    ...actual, // keeps real formatTime
    useStopwatch: () => ({ elapsed: 0, running: false, start: mockStart, stop: mockStop, reset: mockReset }),
  };
});

// ── Stub out browser-API-only components ──────────────────────────────────────
vi.mock("@/components/InstallPrompt", () => ({ default: () => null }));
vi.mock("@/components/InfoModal",     () => ({ default: () => null }));

// ── Replace Radix Select with simple test buttons ─────────────────────────────
vi.mock("@/components/SelectionMenu", () => ({
  default: ({ onModeChange, onLeftDigitsChange, onRightDigitsChange, onGenerate }: any) => (
    <div>
      <button onClick={() => onModeChange("addition")}>set-mode</button>
      <button onClick={() => onLeftDigitsChange(1)}>set-left</button>
      <button onClick={() => onRightDigitsChange(1)}>set-right</button>
      <button onClick={onGenerate}>generate</button>
    </div>
  ),
}));

// ── Shared helpers ────────────────────────────────────────────────────────────
function configure() {
  fireEvent.click(screen.getByRole("button", { name: "set-mode" }));
  fireEvent.click(screen.getByRole("button", { name: "set-left" }));
  fireEvent.click(screen.getByRole("button", { name: "set-right" }));
  fireEvent.click(screen.getByRole("button", { name: "generate" }));
}

function fillAll(value: string) {
  for (const input of screen.getAllByPlaceholderText("?")) {
    fireEvent.change(input, { target: { value } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Home page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the Math Trainer heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Math Trainer");
  });

  it("shows 20 problem inputs after configure and generate", () => {
    render(<Home />);
    configure();
    expect(screen.getAllByPlaceholderText("?")).toHaveLength(20);
  });

  it("shows Perfect message when all 20 answers are correct", () => {
    render(<Home />);
    configure();
    fillAll("8");
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
    expect(screen.getByText(/Perfect/i)).toBeInTheDocument();
  });

  it("shows Keep practicing message when fewer than 70% are correct", () => {
    render(<Home />);
    configure();
    // 10 correct (50%) — score < 70%
    const inputs = screen.getAllByPlaceholderText("?");
    inputs.slice(0, 10).forEach((el) => fireEvent.change(el, { target: { value: "8" } }));
    inputs.slice(10).forEach((el) => fireEvent.change(el, { target: { value: "0" } }));
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
    expect(screen.getByText(/Keep practicing/i)).toBeInTheDocument();
  });

  it("handleModeChange resets the problem list", () => {
    render(<Home />);
    configure();
    expect(screen.getAllByPlaceholderText("?")).toHaveLength(20);
    fireEvent.click(screen.getByRole("button", { name: "set-mode" }));
    expect(screen.queryAllByPlaceholderText("?")).toHaveLength(0);
  });

  it("Reset button clears the problem list", () => {
    render(<Home />);
    configure();
    expect(screen.getAllByPlaceholderText("?")).toHaveLength(20);
    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(screen.queryAllByPlaceholderText("?")).toHaveLength(0);
  });

  it("stopwatch start() is called on the first answer keystroke", () => {
    render(<Home />);
    configure();
    fireEvent.change(screen.getAllByPlaceholderText("?")[0], { target: { value: "8" } });
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it("stopwatch start() is not called again on subsequent keystrokes", () => {
    render(<Home />);
    configure();
    const inputs = screen.getAllByPlaceholderText("?");
    fireEvent.change(inputs[0], { target: { value: "8" } });
    fireEvent.change(inputs[1], { target: { value: "8" } });
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it("persists a correct history entry to localStorage after submit", () => {
    render(<Home />);
    configure();
    fillAll("8");
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
    const stored = JSON.parse(localStorage.getItem("math-trainer-history") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ score: 20, total: 20, mode: "addition" });
  });

  it("persists a partially-correct history entry when some answers are wrong", () => {
    render(<Home />);
    configure();
    const inputs = screen.getAllByPlaceholderText("?");
    inputs.slice(0, 15).forEach((el) => fireEvent.change(el, { target: { value: "8" } }));
    inputs.slice(15).forEach((el) => fireEvent.change(el, { target: { value: "0" } }));
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
    const stored = JSON.parse(localStorage.getItem("math-trainer-history") ?? "[]");
    expect(stored[0]).toMatchObject({ score: 15, total: 20 });
  });
});
