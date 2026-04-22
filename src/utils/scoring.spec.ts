import { describe, it, expect } from "vitest";
import { computeSlowIndices } from "./scoring";

describe("computeSlowIndices", () => {
  it("returns an empty Set when fewer than 3 problems have been answered", () => {
    expect(computeSlowIndices([null, null, null, null], 0)).toEqual(new Set());
    expect(computeSlowIndices([1000, null, null, null], 0)).toEqual(new Set());
    expect(computeSlowIndices([1000, 2000, null, null], 0)).toEqual(new Set());
  });

  it("returns an empty Set when all inter-answer gaps are equal (no outliers)", () => {
    // gaps: 1000, 1000, 1000, 1000, 1000 — median 1000, threshold 2000, none exceed it
    const answeredAt = [1000, 2000, 3000, 4000, 5000];
    expect(computeSlowIndices(answeredAt, 0)).toEqual(new Set());
  });

  it("flags problems whose inter-answer gap exceeds 2× the median", () => {
    // gaps: 1000, 1000, 1000, 1000, 6000 — median 1000, threshold 2000
    // problem at original index 4 has gap 6000 → slow
    const answeredAt = [1000, 2000, 3000, 4000, 10000];
    const result = computeSlowIndices(answeredAt, 0);
    expect(result).toEqual(new Set([4]));
  });

  it("measures the first problem's gap from session start, not zero", () => {
    // start = 5000; first answer at 10000 → gap = 5000
    // remaining gaps: 1000, 1000, 1000, 1000
    // median 1000, threshold 2000 — index 0 is slow
    const answeredAt = [10000, 11000, 12000, 13000, 14000];
    const result = computeSlowIndices(answeredAt, 5000);
    expect(result).toEqual(new Set([0]));
  });

  it("skips null (unanswered) problems and uses original indices", () => {
    // answeredAt[2] is null — excluded from timing
    // timed order: i=0(1000), i=1(2000), i=3(8000), i=4(9000)
    // gaps: 1000, 1000, 6000, 1000 — median 1000, threshold 2000
    // gap for original index 3 is 6000 → slow
    const answeredAt: (number | null)[] = [1000, 2000, null, 8000, 9000];
    const result = computeSlowIndices(answeredAt, 0);
    expect(result).toEqual(new Set([3]));
  });

  it("preserves original problem indices even when answers arrive out of order", () => {
    // Problem 4 answered first (t=1000), then 0,1,2,3 answered at 10000,11000,12000,13000
    // timed sorted: i=4(1000), i=0(10000), i=1(11000), i=2(12000), i=3(13000)
    // gaps: 1000, 9000, 1000, 1000, 1000 — sorted [1000,1000,1000,1000,9000]
    // median 1000, threshold 2000 — original index 0 (gap 9000) is slow
    const answeredAt = [10000, 11000, 12000, 13000, 1000];
    const result = computeSlowIndices(answeredAt, 0);
    expect(result).toEqual(new Set([0]));
  });
});
