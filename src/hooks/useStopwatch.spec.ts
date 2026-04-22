import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { formatTime, useStopwatch } from "./useStopwatch";

describe("formatTime", () => {
  it('formats zero as "0:00.0"', () => expect(formatTime(0)).toBe("0:00.0"));

  it("formats tenths of a second", () => expect(formatTime(100)).toBe("0:00.1"));

  it("pads single-digit seconds with a leading zero", () =>
    expect(formatTime(9000)).toBe("0:09.0"));

  it("formats whole seconds", () => expect(formatTime(5000)).toBe("0:05.0"));

  it("formats exactly one minute", () =>
    expect(formatTime(60000)).toBe("1:00.0"));

  it("formats minutes, seconds, and tenths together", () =>
    expect(formatTime(75500)).toBe("1:15.5"));

  it("formats double-digit minutes", () =>
    expect(formatTime(610000)).toBe("10:10.0"));
});

describe("useStopwatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialises with elapsed=0 and running=false", () => {
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.elapsed).toBe(0);
    expect(result.current.running).toBe(false);
  });

  it("start() sets running to true", () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    expect(result.current.running).toBe(true);
  });

  it("elapsed advances by 100 ms per interval tick", () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.elapsed).toBe(300);
  });

  it("stop() halts the timer and freezes elapsed", () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(500); });
    act(() => { result.current.stop(); });
    const frozen = result.current.elapsed;
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.elapsed).toBe(frozen);
    expect(result.current.running).toBe(false);
  });

  it("reset() returns elapsed to 0 and sets running to false", () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(400); });
    act(() => { result.current.reset(); });
    expect(result.current.elapsed).toBe(0);
    expect(result.current.running).toBe(false);
  });

  it("reset() while running stops the interval — elapsed stays at 0 after further ticks", () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    act(() => { result.current.reset(); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.elapsed).toBe(0);
  });

  it("start() is idempotent — calling twice does not double-count elapsed", () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    act(() => { result.current.start(); }); // no-op: intervalRef already set
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.elapsed).toBe(200);
  });

  it("resumes from the paused position after stop → start", () => {
    // T=0: start. T=300: stop (elapsed=300). T=300: resume. T=500: elapsed=500.
    const { result } = renderHook(() => useStopwatch());
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(300); });
    act(() => { result.current.stop(); });
    act(() => { result.current.start(); });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.elapsed).toBe(500);
  });
});
