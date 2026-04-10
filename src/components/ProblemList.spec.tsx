import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProblemList from "./ProblemList";
import type { Problem } from "@/utils/mathLogic";

// 3 simple addition problems: 1+1=2, 2+1=3, 3+1=4
const PROBLEMS: Problem[] = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  left: i + 1,
  right: 1,
  operator: "+",
  answer: i + 2,
}));

const CORRECT_ANSWERS = ["2", "3", "4"];

const DEFAULTS = {
  problems: PROBLEMS,
  answers: ["", "", ""],
  submitted: false,
  elapsed: 0,
  slowIndices: new Set<number>(),
  onAnswerChange: vi.fn(),
  onSubmit: vi.fn(),
  onReset: vi.fn(),
  onNext: vi.fn(),
};

describe("ProblemList", () => {
  it("renders one input per problem", () => {
    render(<ProblemList {...DEFAULTS} />);
    expect(screen.getAllByPlaceholderText("?")).toHaveLength(3);
  });

  it("Submit is disabled when answers are incomplete", () => {
    render(<ProblemList {...DEFAULTS} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("Submit is enabled when every answer is filled", () => {
    render(<ProblemList {...DEFAULTS} answers={CORRECT_ANSWERS} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeEnabled();
  });

  it("shows score pill after submission", () => {
    render(
      <ProblemList
        {...DEFAULTS}
        answers={CORRECT_ANSWERS}
        submitted={true}
      />
    );
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("swaps Submit for Next after submission", () => {
    render(<ProblemList {...DEFAULTS} submitted={true} />);
    expect(
      screen.queryByRole("button", { name: /submit/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("Reset button is always present", () => {
    render(<ProblemList {...DEFAULTS} />);
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("calls onSubmit when Submit is clicked", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ProblemList
        {...DEFAULTS}
        answers={CORRECT_ANSWERS}
        onSubmit={onSubmit}
      />
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows elapsed time when greater than zero", () => {
    render(<ProblemList {...DEFAULTS} elapsed={5000} />);
    expect(screen.getByText("0:05.0")).toBeInTheDocument();
  });
});
