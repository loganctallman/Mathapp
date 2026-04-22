import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScoreHistory from "./ScoreHistory";
import { makeHistoryEntry } from "@/test/factories";

describe("ScoreHistory", () => {
  it("renders nothing when history is empty", () => {
    const { container } = render(
      <ScoreHistory history={[]} onClear={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "Recent Sessions" heading when history is non-empty', () => {
    render(<ScoreHistory history={[makeHistoryEntry()]} onClear={vi.fn()} />);
    expect(screen.getByText("Recent Sessions")).toBeInTheDocument();
  });

  it("renders the correct operator symbol for each mode", () => {
    render(
      <ScoreHistory
        history={[
          makeHistoryEntry({ mode: "multiplication" }),
          makeHistoryEntry({ mode: "division" }),
        ]}
        onClear={vi.fn()}
      />
    );
    expect(screen.getAllByText("×").length).toBeGreaterThan(0);
    expect(screen.getAllByText("÷").length).toBeGreaterThan(0);
  });

  it("applies yellow colour for a perfect score", () => {
    render(
      <ScoreHistory
        history={[makeHistoryEntry({ score: 20, total: 20 })]}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText("20/20")).toHaveClass("text-yellow-300");
  });

  it("applies green colour for a passing score (≥ 70 %)", () => {
    render(
      <ScoreHistory
        history={[makeHistoryEntry({ score: 14, total: 20 })]}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText("14/20")).toHaveClass("text-emerald-400");
  });

  it("applies red colour for a failing score (< 70 %)", () => {
    render(
      <ScoreHistory
        history={[makeHistoryEntry({ score: 10, total: 20 })]}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText("10/20")).toHaveClass("text-rose-400");
  });

  it('shows "Today" for entries timestamped today', () => {
    render(
      <ScoreHistory
        history={[makeHistoryEntry({ date: Date.now() })]}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("calls onClear when the Clear button is clicked", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<ScoreHistory history={[makeHistoryEntry()]} onClear={onClear} />);
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
