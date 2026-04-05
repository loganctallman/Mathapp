"use client";

import { useEffect, useRef, useState } from "react";
import { Problem } from "@/utils/mathLogic";

interface Props {
  problem: Problem;
  index: number;
  value: string;
  submitted: boolean;
  isSlow: boolean;
  onChange: (value: string) => void;
  onEnterKey: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}

export default function ProblemItem({
  problem,
  index,
  value,
  submitted,
  isSlow,
  onChange,
  onEnterKey,
  inputRef,
}: Props) {
  const isCorrect = submitted && parseInt(value, 10) === problem.answer;
  const isWrong   = submitted && parseInt(value, 10) !== problem.answer;
  const [shook, setShook] = useState(false);
  const prevSubmitted = useRef(false);

  // Trigger shake once when result is revealed as wrong
  useEffect(() => {
    if (submitted && !prevSubmitted.current && isWrong) {
      setShook(true);
      const t = setTimeout(() => setShook(false), 500);
      return () => clearTimeout(t);
    }
    prevSubmitted.current = submitted;
  }, [submitted, isWrong]);

  const cardClass = [
    "glass-sm rounded-xl px-4 py-3 flex items-center gap-2 font-mono",
    "transition-all duration-200",
    !submitted && "hover:scale-[1.02] hover:-translate-y-0.5 hover:brightness-125",
    isCorrect && "glow-green",
    isWrong   && "glow-red",
    shook     && "shake",
  ]
    .filter(Boolean)
    .join(" ");

  const inputClass = [
    "w-16 rounded-lg px-2 py-1 text-center font-bold text-sm transition-all duration-200",
    "focus:outline-none focus:ring-2",
    submitted
      ? "cursor-not-allowed"
      : "focus:ring-slate-400/60 hover:brightness-125",
    isCorrect
      ? "bg-emerald-400/10 border border-emerald-400/50 text-emerald-300"
      : isWrong
        ? "bg-rose-400/10 border border-rose-400/50 text-rose-300"
        : "glass-sm text-white placeholder-white/25",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <span className="text-white/25 text-xs font-bold w-5 shrink-0 tabular-nums">
        {index + 1}.
      </span>
      <span className="text-white font-bold tabular-nums text-sm min-w-[5ch] text-right">
        {problem.left}
      </span>
      <span className="text-white/50 font-black text-sm w-4 text-center">
        {problem.operator}
      </span>
      <span className="text-white font-bold tabular-nums text-sm min-w-[4ch]">
        {problem.right}
      </span>
      <span className="text-white/50 font-black text-sm">=</span>
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnterKey();
          }
        }}
        disabled={submitted}
        className={inputClass}
        placeholder="?"
      />
      {submitted ? (
        <span className={`text-xs font-black ml-auto ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
          {isCorrect ? "✓" : `✗ ${problem.answer}`}
        </span>
      ) : isSlow && value !== "" ? (
        <span className="text-amber-400/60 ml-auto" title="Took a while">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </span>
      ) : null}
    </div>
  );
}
