import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultCard from "./ResultCard";

describe("ResultCard", () => {
  it('shows "Perfect score!" when all answers are correct', () => {
    render(<ResultCard score={20} total={20} timeMs={0} onReset={vi.fn()} />);
    expect(screen.getByText("Perfect score!")).toBeInTheDocument();
  });

  it('shows "Good work!" for a passing score (≥ 70 %)', () => {
    render(<ResultCard score={14} total={20} timeMs={0} onReset={vi.fn()} />);
    expect(screen.getByText("Good work!")).toBeInTheDocument();
  });

  it('shows "Keep practicing!" for a failing score (< 70 %)', () => {
    render(<ResultCard score={10} total={20} timeMs={0} onReset={vi.fn()} />);
    expect(screen.getByText("Keep practicing!")).toBeInTheDocument();
  });

  it("displays the score numerator and denominator", () => {
    render(<ResultCard score={15} total={20} timeMs={0} onReset={vi.fn()} />);
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("/20")).toBeInTheDocument();
  });

  it("displays the formatted time when timeMs > 0", () => {
    render(<ResultCard score={20} total={20} timeMs={65000} onReset={vi.fn()} />);
    expect(screen.getByText("1:05.0")).toBeInTheDocument();
  });

  it("hides the time display when timeMs is 0", () => {
    render(<ResultCard score={20} total={20} timeMs={0} onReset={vi.fn()} />);
    expect(screen.queryByText(/\d:\d\d\.\d/)).not.toBeInTheDocument();
  });

  it("calls onReset when Try Again is clicked", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<ResultCard score={10} total={20} timeMs={0} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
