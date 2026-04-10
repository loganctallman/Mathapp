import { describe, it, expect } from "vitest";
import { formatTime } from "./useStopwatch";

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
