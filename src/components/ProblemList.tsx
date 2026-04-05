"use client";

import { useRef } from "react";
import { Problem } from "@/utils/mathLogic";
import ProblemItem from "./ProblemItem";
import { formatTime } from "@/hooks/useStopwatch";

interface Props {
  problems: Problem[];
  answers: string[];
  submitted: boolean;
  elapsed: number;
  slowIndices: Set<number>;
  onAnswerChange: (index: number, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  onNext: () => void;
}

export default function ProblemList({
  problems,
  answers,
  submitted,
  elapsed,
  slowIndices,
  onAnswerChange,
  onSubmit,
  onReset,
  onNext,
}: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const filledCount = answers.filter((a) => a.trim() !== "").length;
  const allFilled = filledCount === problems.length;
  const score = submitted
    ? problems.filter((p, i) => parseInt(answers[i], 10) === p.answer).length
    : 0;

  function handleEnterKey(i: number) {
    if (i < problems.length - 1) {
      inputRefs.current[i + 1]?.focus();
    } else if (allFilled) {
      onSubmit();
    }
  }

  const primaryBtn =
    "px-7 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white " +
    "bg-gradient-to-r from-slate-500 to-gray-600 " +
    "shadow-[0_0_20px_rgba(100,116,139,0.35)] " +
    "hover:from-slate-400 hover:to-gray-500 " +
    "hover:shadow-[0_0_32px_rgba(100,116,139,0.55)] " +
    "hover:scale-[1.04] active:scale-[0.97] " +
    "transition-all duration-200 " +
    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none";

  const ghostBtn =
    "px-7 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white/70 " +
    "glass-sm hover:brightness-125 hover:text-white hover:scale-[1.04] " +
    "active:scale-[0.97] transition-all duration-200";

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white/90 text-xs font-bold uppercase tracking-[0.2em]">
          Problems
        </h2>
        <div className="flex items-center gap-3">
          {/* Live timer / final time */}
          {elapsed > 0 && (
            <span className="text-white/40 text-xs font-mono tabular-nums">
              {formatTime(elapsed)}
            </span>
          )}
          {/* Progress / score pill */}
          {submitted ? (
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full
              bg-gradient-to-r from-slate-500/30 to-gray-500/30
              border border-slate-400/30 text-slate-200">
              {score}/{problems.length}
            </span>
          ) : (
            <span className="text-xs font-bold tabular-nums px-3 py-1 rounded-full
              bg-white/5 border border-white/10 text-white/40">
              {filledCount}/{problems.length}
            </span>
          )}
        </div>
      </div>

      {/* Problem grid with staggered fade-in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {problems.map((problem, i) => (
          <div
            key={problem.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <ProblemItem
              problem={problem}
              index={i}
              value={answers[i]}
              submitted={submitted}
              isSlow={slowIndices.has(i)}
              onChange={(v) => onAnswerChange(i, v)}
              onEnterKey={() => handleEnterKey(i)}
              inputRef={(el) => { inputRefs.current[i] = el; }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!submitted && (
          <button onClick={onSubmit} disabled={!allFilled} className={primaryBtn}>
            Submit
          </button>
        )}
        {submitted && (
          <button onClick={onNext} className={primaryBtn}>
            Next
          </button>
        )}
        <button onClick={onReset} className={ghostBtn}>
          Reset
        </button>
      </div>
    </div>
  );
}
