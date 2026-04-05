export type Mode = "addition" | "subtraction" | "multiplication" | "division";

export interface Problem {
  id: number;
  left: number;
  right: number;
  operator: string;
  answer: number;
}

export function digitMin(digits: number): number {
  return digits === 1 ? 1 : Math.pow(10, digits - 1);
}

export function digitMax(digits: number): number {
  return Math.pow(10, digits) - 1;
}

function randomIntCapped(digits: number, cap: number): number {
  const min = digitMin(digits);
  const max = Math.min(digitMax(digits), cap);
  return Math.floor(Math.random() * (Math.max(min, max) - min + 1)) + min;
}

function generateProblem(
  mode: Mode,
  leftDigits: number,
  rightDigits: number,
  leftMax: number,
  rightMax: number,
  id: number
): Problem {
  switch (mode) {
    case "addition": {
      const left  = randomIntCapped(leftDigits, leftMax);
      const right = randomIntCapped(rightDigits, rightMax);
      return { id, left, right, operator: "+", answer: left + right };
    }
    case "subtraction": {
      const a = randomIntCapped(leftDigits, leftMax);
      const b = randomIntCapped(rightDigits, rightMax);
      const left  = Math.max(a, b);
      const right = Math.min(a, b);
      return { id, left, right, operator: "−", answer: left - right };
    }
    case "multiplication": {
      const left  = randomIntCapped(leftDigits, leftMax);
      const right = randomIntCapped(rightDigits, rightMax);
      return { id, left, right, operator: "×", answer: left * right };
    }
    case "division": {
      // leftDigits/leftMax  → divisor  (displayed on the RIGHT of ÷)
      // rightDigits/rightMax → quotient (the answer; unconstrained by digit count,
      //                        so the user can push it up to 5 000 via the slider)
      // dividend = divisor × quotient — displayed on the LEFT, size is derived and unconstrained.
      // This guarantees a whole-number answer by construction.
      const divisor  = randomIntCapped(leftDigits, leftMax);
      const quotient = randomIntCapped(rightDigits, rightMax);
      return { id, left: divisor * quotient, right: divisor, operator: "÷", answer: quotient };
    }
  }
}

export function generateProblems(
  mode: Mode,
  leftDigits: number,
  rightDigits: number,
  options: { leftMax?: number; rightMax?: number; count?: number } = {}
): Problem[] {
  const { leftMax = digitMax(leftDigits), rightMax = digitMax(rightDigits), count = 20 } = options;
  return Array.from({ length: count }, (_, i) =>
    generateProblem(mode, leftDigits, rightDigits, leftMax, rightMax, i)
  );
}
