import { describe, it, expect } from "vitest";
import { digitMin, digitMax, generateProblems } from "./mathLogic";

describe("digitMin", () => {
  it("returns 1 for 1 digit", () => expect(digitMin(1)).toBe(1));
  it("returns 10 for 2 digits", () => expect(digitMin(2)).toBe(10));
  it("returns 100 for 3 digits", () => expect(digitMin(3)).toBe(100));
  it("returns 1000 for 4 digits", () => expect(digitMin(4)).toBe(1000));
});

describe("digitMax", () => {
  it("returns 9 for 1 digit", () => expect(digitMax(1)).toBe(9));
  it("returns 99 for 2 digits", () => expect(digitMax(2)).toBe(99));
  it("returns 999 for 3 digits", () => expect(digitMax(3)).toBe(999));
});

describe("generateProblems", () => {
  it("returns 20 problems by default", () => {
    expect(generateProblems("addition", 1, 1)).toHaveLength(20);
  });

  it("respects a custom count", () => {
    expect(generateProblems("addition", 1, 1, { count: 7 })).toHaveLength(7);
  });

  it("assigns sequential ids starting at 0", () => {
    const probs = generateProblems("multiplication", 1, 1, { count: 5 });
    probs.forEach((p, i) => expect(p.id).toBe(i));
  });

  it("addition: answer equals left + right", () => {
    generateProblems("addition", 2, 2).forEach((p) =>
      expect(p.answer).toBe(p.left + p.right)
    );
  });

  it("subtraction: answer is non-negative and equals left − right", () => {
    generateProblems("subtraction", 2, 2).forEach((p) => {
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBe(p.left - p.right);
    });
  });

  it("multiplication: answer equals left × right", () => {
    generateProblems("multiplication", 2, 2).forEach((p) =>
      expect(p.answer).toBe(p.left * p.right)
    );
  });

  it("division: answer is a whole number and left / right === answer", () => {
    generateProblems("division", 1, 1).forEach((p) => {
      expect(Number.isInteger(p.answer)).toBe(true);
      expect(p.left / p.right).toBe(p.answer);
    });
  });

  it("respects leftMax cap — all left operands stay within cap", () => {
    generateProblems("addition", 2, 1, { leftMax: 15 }).forEach((p) =>
      expect(p.left).toBeLessThanOrEqual(15)
    );
  });

  it("respects rightMax cap — all right operands stay within cap", () => {
    generateProblems("addition", 1, 2, { rightMax: 20 }).forEach((p) =>
      expect(p.right).toBeLessThanOrEqual(20)
    );
  });
});
