import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useScoreHistory } from "./useScoreHistory";

const BASE_ENTRY = {
  mode: "addition" as const,
  leftDigits: 1,
  rightDigits: 1,
  score: 18,
  total: 20,
  timeMs: 45000,
};

describe("useScoreHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with an empty history", () => {
    const { result } = renderHook(() => useScoreHistory());
    expect(result.current.history).toHaveLength(0);
  });

  it("addEntry prepends a new entry", () => {
    const { result } = renderHook(() => useScoreHistory());
    act(() => result.current.addEntry(BASE_ENTRY));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].score).toBe(18);
  });

  it("addEntry caps history at 10 entries", () => {
    const { result } = renderHook(() => useScoreHistory());
    act(() => {
      for (let i = 0; i < 12; i++) result.current.addEntry(BASE_ENTRY);
    });
    expect(result.current.history).toHaveLength(10);
  });

  it("clearHistory empties the list", () => {
    const { result } = renderHook(() => useScoreHistory());
    act(() => result.current.addEntry(BASE_ENTRY));
    act(() => result.current.clearHistory());
    expect(result.current.history).toHaveLength(0);
  });

  it("persists entries to localStorage", () => {
    const { result } = renderHook(() => useScoreHistory());
    act(() => result.current.addEntry(BASE_ENTRY));
    const stored = JSON.parse(localStorage.getItem("math-trainer-history")!);
    expect(stored).toHaveLength(1);
    expect(stored[0].score).toBe(18);
  });

  it("clearHistory removes the localStorage key", () => {
    const { result } = renderHook(() => useScoreHistory());
    act(() => result.current.addEntry(BASE_ENTRY));
    act(() => result.current.clearHistory());
    expect(localStorage.getItem("math-trainer-history")).toBeNull();
  });

  it("loads persisted history on mount", async () => {
    const saved = [{ ...BASE_ENTRY, id: "abc", date: Date.now() }];
    localStorage.setItem("math-trainer-history", JSON.stringify(saved));
    const { result } = renderHook(() => useScoreHistory());
    await waitFor(() => expect(result.current.history).toHaveLength(1));
  });
});
