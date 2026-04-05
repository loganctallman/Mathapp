"use client";

import { formatTime } from "@/hooks/useStopwatch";

interface Props {
  score: number;
  total: number;
  timeMs: number;
  onReset: () => void;
}

export default function ResultCard({ score, total, timeMs, onReset }: Props) {
  const pct     = Math.round((score / total) * 100);
  const perfect = score === total;
  const passing = pct >= 70;

  const accentGradient = perfect
    ? "from-yellow-400/30 via-amber-300/20 to-orange-400/20"
    : passing
      ? "from-emerald-500/25 via-teal-400/15 to-cyan-400/20"
      : "from-rose-500/25 via-pink-400/15 to-fuchsia-400/20";

  const glowColor = perfect
    ? "rgba(251,191,36,0.35)"
    : passing
      ? "rgba(52,211,153,0.3)"
      : "rgba(251,113,133,0.3)";

  const scoreColor = perfect
    ? "from-yellow-300 to-amber-400"
    : passing
      ? "from-emerald-300 to-teal-400"
      : "from-rose-300 to-pink-400";

  const message = perfect
    ? "Perfect score!"
    : passing
      ? "Good work!"
      : "Keep practicing!";

  return (
    <div
      className={`rounded-2xl p-6 bg-gradient-to-br ${accentGradient} backdrop-blur-2xl border border-white/15`}
      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 40px ${glowColor}` }}
    >
      <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-2">
        Result
      </p>

      <div className="flex items-end gap-4 mb-1">
        <p className={`text-6xl font-black tabular-nums bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
          {score}
          <span className="text-3xl text-white/30">/{total}</span>
        </p>
        {timeMs > 0 && (
          <p className="text-white/40 text-2xl font-black font-mono tabular-nums mb-1">
            {formatTime(timeMs)}
          </p>
        )}
      </div>

      <p className="text-white/70 text-base font-bold uppercase tracking-widest mb-5">
        {message}
      </p>
      <button
        onClick={onReset}
        className="px-7 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white/70
          glass-sm hover:brightness-125 hover:text-white hover:scale-[1.04]
          active:scale-[0.97] transition-all duration-200"
      >
        Try Again
      </button>
    </div>
  );
}
