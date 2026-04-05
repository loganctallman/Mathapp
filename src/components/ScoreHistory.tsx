"use client";

import { HistoryEntry } from "@/hooks/useScoreHistory";
import { formatTime } from "@/hooks/useStopwatch";

const MODE_SYMBOL: Record<string, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

function relativeDate(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const todayStr = now.toDateString();
  const dStr = d.toDateString();
  if (dStr === todayStr) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dStr === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface Props {
  history: HistoryEntry[];
  onClear: () => void;
}

export default function ScoreHistory({ history, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/90 text-xs font-bold uppercase tracking-[0.2em]">
          Recent Sessions
        </h2>
        <button
          onClick={onClear}
          className="text-white/30 text-xs font-semibold uppercase tracking-widest
            hover:text-white/60 transition-colors duration-200"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {history.map((entry, i) => {
          const pct = Math.round((entry.score / entry.total) * 100);
          const perfect = entry.score === entry.total;
          const passing = pct >= 70;
          const scoreColor = perfect
            ? "text-yellow-300"
            : passing
              ? "text-emerald-400"
              : "text-rose-400";

          return (
            <div
              key={entry.id}
              className="glass-sm rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={{ opacity: 1 - i * 0.07 }}
            >
              {/* Mode badge */}
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center
                text-white/70 font-black text-sm shrink-0">
                {MODE_SYMBOL[entry.mode]}
              </span>

              {/* Config */}
              <span className="text-white/40 text-xs font-semibold tabular-nums">
                {entry.leftDigits}d {MODE_SYMBOL[entry.mode]} {entry.rightDigits}d
              </span>

              {/* Score */}
              <span className={`text-sm font-black tabular-nums ml-auto ${scoreColor}`}>
                {entry.score}/{entry.total}
              </span>

              {/* Time */}
              <span className="text-white/40 text-xs font-mono tabular-nums w-14 text-right">
                {formatTime(entry.timeMs)}
              </span>

              {/* Date */}
              <span className="text-white/25 text-xs font-semibold w-16 text-right shrink-0">
                {relativeDate(entry.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
