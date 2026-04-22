import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProblemItem from "./ProblemItem";
import { makeProblem } from "@/test/factories";

const PROBLEM = makeProblem({ left: 12, right: 5, answer: 17 });

const DEFAULTS = {
  problem: PROBLEM,
  index: 0,
  value: "",
  submitted: false,
  isSlow: false,
  onChange: vi.fn(),
  onEnterKey: vi.fn(),
  inputRef: vi.fn(),
};

describe("ProblemItem", () => {
  it("renders the problem equation with index label", () => {
    render(<ProblemItem {...DEFAULTS} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("1.")).toBeInTheDocument();
  });

  it("shows ✓ when submitted with the correct answer", () => {
    render(<ProblemItem {...DEFAULTS} value="17" submitted={true} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows ✗ and the correct answer when submitted wrong", () => {
    render(<ProblemItem {...DEFAULTS} value="10" submitted={true} />);
    expect(screen.getByText("✗ 17")).toBeInTheDocument();
  });

  it("disables the input after submission", () => {
    render(<ProblemItem {...DEFAULTS} submitted={true} />);
    expect(screen.getByPlaceholderText("?")).toBeDisabled();
  });

  it("calls onEnterKey when Enter is pressed in the input", async () => {
    const onEnterKey = vi.fn();
    const user = userEvent.setup();
    render(<ProblemItem {...DEFAULTS} onEnterKey={onEnterKey} />);
    await user.click(screen.getByPlaceholderText("?"));
    await user.keyboard("{Enter}");
    expect(onEnterKey).toHaveBeenCalledOnce();
  });

  it("shows the slow-indicator when isSlow is true and value is non-empty", () => {
    render(<ProblemItem {...DEFAULTS} value="5" isSlow={true} />);
    expect(screen.getByTitle("Took a while")).toBeInTheDocument();
  });

  it("does not show the slow-indicator when the input is empty", () => {
    render(<ProblemItem {...DEFAULTS} value="" isSlow={true} />);
    expect(screen.queryByTitle("Took a while")).not.toBeInTheDocument();
  });
});
