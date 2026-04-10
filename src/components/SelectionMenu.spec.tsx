import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectionMenu from "./SelectionMenu";
import type { Mode } from "@/utils/mathLogic";

type Props = React.ComponentProps<typeof SelectionMenu>;

const DEFAULTS: Props = {
  mode: "" as Mode | "",
  leftDigits: "" as number | "",
  rightDigits: "" as number | "",
  leftMax: 9,
  rightMax: 9,
  onModeChange: vi.fn(),
  onLeftDigitsChange: vi.fn(),
  onRightDigitsChange: vi.fn(),
  onLeftMaxChange: vi.fn(),
  onRightMaxChange: vi.fn(),
  onGenerate: vi.fn(),
};

describe("SelectionMenu", () => {
  it("shows only the mode dropdown before anything is selected", () => {
    render(<SelectionMenu {...DEFAULTS} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.queryByText(/left digits/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/right digits/i)).not.toBeInTheDocument();
  });

  it("reveals the left-digits selector once a mode is chosen", () => {
    render(<SelectionMenu {...DEFAULTS} mode="addition" />);
    expect(screen.getByText(/left digits/i)).toBeInTheDocument();
    expect(screen.queryByText(/right digits/i)).not.toBeInTheDocument();
  });

  it("reveals the right-digits selector once left digits are chosen", () => {
    render(<SelectionMenu {...DEFAULTS} mode="addition" leftDigits={1} />);
    expect(screen.getByText(/right digits/i)).toBeInTheDocument();
  });

  it("Generate button only appears when all three dropdowns are set", () => {
    const { rerender } = render(<SelectionMenu {...DEFAULTS} />);
    expect(
      screen.queryByRole("button", { name: /generate/i })
    ).not.toBeInTheDocument();

    rerender(
      <SelectionMenu {...DEFAULTS} mode="addition" leftDigits={1} rightDigits={1} />
    );
    expect(
      screen.getByRole("button", { name: /generate/i })
    ).toBeInTheDocument();
  });

  it("shows Divisor/Quotient labels in division mode", () => {
    render(<SelectionMenu {...DEFAULTS} mode="division" leftDigits={1} />);
    expect(screen.getByText(/divisor digits/i)).toBeInTheDocument();
    expect(screen.getByText(/quotient digits/i)).toBeInTheDocument();
  });

  it("calls onGenerate when the Generate button is clicked", async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectionMenu
        {...DEFAULTS}
        mode="addition"
        leftDigits={1}
        rightDigits={1}
        onGenerate={onGenerate}
      />
    );
    await user.click(screen.getByRole("button", { name: /generate/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it("slider appears after digit selection and reflects current value", () => {
    render(
      <SelectionMenu {...DEFAULTS} mode="multiplication" leftDigits={2} leftMax={50} />
    );
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
