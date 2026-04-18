"use client";

import * as Select from "@radix-ui/react-select";
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

interface GlassSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  items: { value: string; label: string }[];
}

function GlassSelect({ value, onValueChange, placeholder, items }: GlassSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={
          "w-full glass-sm rounded-xl px-4 py-3 text-white font-semibold text-sm " +
          "focus:outline-none focus:ring-2 focus:ring-slate-400/50 " +
          "cursor-pointer transition-all duration-200 hover:brightness-125 " +
          "flex items-center justify-between gap-2 " +
          "data-[placeholder]:text-white/40"
        }
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-white/50 shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className={
            "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl " +
            "border border-white/10 " +
            "bg-[#111114]/95 backdrop-blur-2xl " +
            "shadow-[0_8px_40px_rgba(0,0,0,0.6)] " +
            "animate-in fade-in-0 zoom-in-95 " +
            "data-[side=bottom]:slide-in-from-top-2"
          }
        >
          <Select.Viewport className="p-1.5">
            {items.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                className={
                  "relative flex items-center justify-between gap-4 " +
                  "px-3 py-2.5 rounded-lg " +
                  "text-white/80 font-semibold text-sm " +
                  "cursor-pointer select-none outline-none " +
                  "transition-colors duration-100 " +
                  "data-[highlighted]:bg-white/10 data-[highlighted]:text-white " +
                  "data-[state=checked]:text-white"
                }
              >
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
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
          <GlassSelect
            value={mode}
            onValueChange={(v) => onModeChange(v as Mode)}
            placeholder="Select mode…"
            items={MODES.map((m) => ({ value: m.value, label: m.label }))}
          />
        </div>

        {/* Left Digits + Max slider */}
        {mode !== "" && (
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              {mode === "division" ? "Divisor Digits" : "Left Digits"}
            </label>
            <GlassSelect
              value={leftDigits === "" ? "" : String(leftDigits)}
              onValueChange={(v) => onLeftDigitsChange(Number(v))}
              placeholder="Select digits…"
              items={DIGITS.map((d) => ({ value: String(d), label: `${d} digit${d > 1 ? "s" : ""}` }))}
            />

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
            <GlassSelect
              value={rightDigits === "" ? "" : String(rightDigits)}
              onValueChange={(v) => onRightDigitsChange(Number(v))}
              placeholder="Select digits…"
              items={DIGITS.map((d) => ({ value: String(d), label: `${d} digit${d > 1 ? "s" : ""}` }))}
            />

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
