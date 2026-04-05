"use client";

import { Mode, digitMin, digitMax } from "@/utils/mathLogic";

interface Props {
  mode: Mode | "";
  leftDigits: number | "";
  rightDigits: number | "";
  leftMax: number;
  rightMax: number;
  onModeChange: (m: Mode) => void;
  onLeftDigitsChange: (d: number) => void;
  onRightDigitsChange: (d: number) => void;
  onLeftMaxChange: (max: number) => void;
  onRightMaxChange: (max: number) => void;
  onGenerate: () => void;
}

const MODES: { value: Mode; label: string }[] = [
  { value: "addition",       label: "Addition  +" },
  { value: "subtraction",    label: "Subtraction  −" },
  { value: "multiplication", label: "Multiplication  ×" },
  { value: "division",       label: "Division  ÷" },
];

const DIGITS = [1, 2, 3, 4];

function sliderTrackStyle(value: number, min: number, max: number): React.CSSProperties {
  const pct = max === min ? 100 : ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right,
      rgba(255,255,255,0.55) 0%,
      rgba(255,255,255,0.55) ${pct}%,
      rgba(255,255,255,0.10) ${pct}%,
      rgba(255,255,255,0.10) 100%)`,
    borderRadius: "9999px",
  };
}

export default function SelectionMenu({
  mode,
  leftDigits,
  rightDigits,
  leftMax,
  rightMax,
  onModeChange,
  onLeftDigitsChange,
  onRightDigitsChange,
  onLeftMaxChange,
  onRightMaxChange,
  onGenerate,
}: Props) {
  const canGenerate = mode !== "" && leftDigits !== "" && rightDigits !== "";

  const selectClass =
    "w-full appearance-none glass-sm rounded-xl px-4 py-3 text-white font-semibold text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-slate-400/50 " +
    "cursor-pointer transition-all duration-200 hover:brightness-125";

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-5">
        Configure
      </h2>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Mode */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-white/40 text-xs font-semibold uppercase tracking-widest">
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as Mode)}
            className={selectClass}
          >
            <option value="" disabled>Select mode…</option>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Left Digits + Max slider */}
        {mode !== "" && (
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              {mode === "division" ? "Divisor Digits" : "Left Digits"}
            </label>
            <select
              value={leftDigits}
              onChange={(e) => onLeftDigitsChange(Number(e.target.value))}
              className={selectClass}
            >
              <option value="" disabled>Select digits…</option>
              {DIGITS.map((d) => (
                <option key={d} value={d}>{d} digit{d > 1 ? "s" : ""}</option>
              ))}
            </select>

            {leftDigits !== "" && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">
                    Max value
                  </span>
                  <span className="text-white/70 text-xs font-black tabular-nums">
                    {leftMax.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={digitMin(leftDigits)}
                  max={digitMax(leftDigits)}
                  value={leftMax}
                  onChange={(e) => onLeftMaxChange(Number(e.target.value))}
                  style={sliderTrackStyle(leftMax, digitMin(leftDigits), digitMax(leftDigits))}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-white/20 text-[10px] font-mono">
                    {digitMin(leftDigits).toLocaleString()}
                  </span>
                  <span className="text-white/20 text-[10px] font-mono">
                    {digitMax(leftDigits).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Digits + Max slider */}
        {mode !== "" && leftDigits !== "" && (
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              {mode === "division" ? "Quotient Digits" : "Right Digits"}
            </label>
            <select
              value={rightDigits}
              onChange={(e) => onRightDigitsChange(Number(e.target.value))}
              className={selectClass}
            >
              <option value="" disabled>Select digits…</option>
              {DIGITS.map((d) => (
                <option key={d} value={d}>{d} digit{d > 1 ? "s" : ""}</option>
              ))}
            </select>

            {rightDigits !== "" && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">
                    Max value
                  </span>
                  <span className="text-white/70 text-xs font-black tabular-nums">
                    {rightMax.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={digitMin(rightDigits)}
                  max={digitMax(rightDigits)}
                  value={rightMax}
                  onChange={(e) => onRightMaxChange(Number(e.target.value))}
                  style={sliderTrackStyle(rightMax, digitMin(rightDigits), digitMax(rightDigits))}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-white/20 text-[10px] font-mono">
                    {digitMin(rightDigits).toLocaleString()}
                  </span>
                  <span className="text-white/20 text-[10px] font-mono">
                    {digitMax(rightDigits).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {canGenerate && (
        <button
          onClick={onGenerate}
          className="mt-6 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white
            bg-gradient-to-r from-slate-500 to-gray-600
            shadow-[0_0_24px_rgba(100,116,139,0.4)]
            hover:from-slate-400 hover:to-gray-500
            hover:shadow-[0_0_36px_rgba(100,116,139,0.6)]
            hover:scale-[1.03] active:scale-[0.98]
            transition-all duration-200"
        >
          Generate Problems
        </button>
      )}
    </div>
  );
}
