import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoModal from "./InfoModal";

describe("InfoModal", () => {
  it("renders the info trigger button", () => {
    render(<InfoModal />);
    expect(screen.getByRole("button", { name: /info/i })).toBeInTheDocument();
  });

  it("modal content is hidden initially", () => {
    render(<InfoModal />);
    expect(
      screen.queryByText(/master your mental math/i)
    ).not.toBeInTheDocument();
  });

  it("opens when the info button is clicked", async () => {
    const user = userEvent.setup();
    render(<InfoModal />);
    await user.click(screen.getByRole("button", { name: /info/i }));
    expect(screen.getByText(/master your mental math/i)).toBeInTheDocument();
  });

  it("closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<InfoModal />);
    await user.click(screen.getByRole("button", { name: /info/i }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(
      screen.queryByText(/master your mental math/i)
    ).not.toBeInTheDocument();
  });

  it("closes when the backdrop is clicked directly", async () => {
    const user = userEvent.setup();
    render(<InfoModal />);
    await user.click(screen.getByRole("button", { name: /info/i }));
    // The outermost fixed wrapper handles backdrop clicks
    const backdrop = document.querySelector(".fixed.inset-0") as HTMLElement;
    fireEvent.click(backdrop);
    expect(
      screen.queryByText(/master your mental math/i)
    ).not.toBeInTheDocument();
  });
});
