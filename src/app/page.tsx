"use client";

import { useState } from "react";
import SelectionMenu from "@/components/SelectionMenu";
import ProblemList from "@/components/ProblemList";
import ResultCard from "@/components/ResultCard";
import ScoreHistory from "@/components/ScoreHistory";
import InstallPrompt from "@/components/InstallPrompt";
import InfoModal from "@/components/InfoModal";
import { generateProblems, digitMax, Mode, Problem } from "@/utils/mathLogic";
import { computeSlowIndices } from "@/utils/scoring";
import { useStopwatch } from "@/hooks/useStopwatch";
import { useScoreHistory } from "@/hooks/useScoreHistory";

export default function Home() {
  const [mode, setMode] = useState<Mode | "">("");
  const [leftDigits, setLeftDigits] = useState<number | "">("");
  const [rightDigits, setRightDigits] = useState<number | "">("");
  const [leftMax, setLeftMax] = useState(0);
  const [rightMax, setRightMax] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Timing
  const stopwatch = useStopwatch();
  const [firstAnsweredAt, setFirstAnsweredAt] = useState<(number | null)[]>([]);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [finalTime, setFinalTime] = useState(0);
  const [slowIndices, setSlowIndices] = useState<Set<number>>(new Set());

  // History
  const { history, addEntry, clearHistory } = useScoreHistory();

  const score = submitted && problems.length > 0
    ? problems.filter((p, i) => parseInt(answers[i], 10) === p.answer).length
    : 0;

  function handleGenerate() {
    if (mode === "" || leftDigits === "" || rightDigits === "") return;
    const newProblems = generateProblems(mode, leftDigits, rightDigits, { leftMax, rightMax });
    setProblems(newProblems);
    setAnswers(Array(newProblems.length).fill(""));
    setSubmitted(false);
    setFirstAnsweredAt(Array(newProblems.length).fill(null));
    setSessionStart(null);
    setFinalTime(0);
    setSlowIndices(new Set());
    stopwatch.reset();
  }

  function handleAnswerChange(index: number, value: string) {
    // Start stopwatch on first keystroke
    if (sessionStart === null && value.trim() !== "") {
      const now = Date.now();
      setSessionStart(now);
      stopwatch.start();
    }

    // Record first answer timestamp per problem
    if (value.trim() !== "") {
      setFirstAnsweredAt((prev) => {
        if (prev[index] !== null) return prev;
        const next = [...prev];
        next[index] = Date.now();
        return next;
      });
    }

    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleSubmit() {
    stopwatch.stop();
    const time = stopwatch.elapsed;
    setFinalTime(time);
    setSubmitted(true);

    const currentScore = problems.filter(
      (p, i) => parseInt(answers[i], 10) === p.answer
    ).length;

    addEntry({
      mode: mode as Mode,
      leftDigits: leftDigits as number,
      rightDigits: rightDigits as number,
      score: currentScore,
      total: problems.length,
      timeMs: time,
    });

    if (sessionStart !== null) {
      setSlowIndices(computeSlowIndices(firstAnsweredAt, sessionStart));
    }
  }

  function handleReset() {
    setProblems([]);
    setAnswers([]);
    setSubmitted(false);
    setFirstAnsweredAt([]);
    setSessionStart(null);
    setFinalTime(0);
    setSlowIndices(new Set());
    stopwatch.reset();
  }

  function handleModeChange(m: Mode) {
    setMode(m);
    setLeftDigits("");
    setRightDigits("");
    handleReset();
  }

  return (
    <>
      {/* Fixed deep-space background with animated orbs */}
      <div className="fixed inset-0 -z-10 bg-[#111114] overflow-hidden">
        <div className="orb-a absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-slate-500/25 blur-[110px]" />
        <div className="orb-b absolute top-[35%] -right-48 w-[480px] h-[480px] rounded-full bg-gray-400/18 blur-[100px]" />
        <div className="orb-c absolute -bottom-48 left-[15%] w-[600px] h-[600px] rounded-full bg-slate-600/28 blur-[120px]" />
        <div className="orb-d absolute top-[12%] right-[28%] w-[280px] h-[280px] rounded-full bg-zinc-400/14 blur-[80px]" />
        <div className="orb-b absolute bottom-[20%] right-[10%] w-[320px] h-[320px] rounded-full bg-slate-500/18 blur-[90px]" />
      </div>

      <main className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="mb-2">
            <div className="flex items-start gap-3">
              <h1 className="gradient-text text-5xl sm:text-6xl font-black uppercase tracking-tight leading-none">
                Math Trainer
              </h1>
              <div className="mt-1.5">
                <InfoModal />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-white/70 text-sm font-semibold uppercase tracking-[0.2em]">
                Simple · Fast · No excuses
              </p>
              <InstallPrompt />
            </div>
          </div>

          <SelectionMenu
            mode={mode}
            leftDigits={leftDigits}
            rightDigits={rightDigits}
            leftMax={leftMax}
            rightMax={rightMax}
            onModeChange={handleModeChange}
            onLeftDigitsChange={(d) => {
              setLeftDigits(d);
              setLeftMax(digitMax(d));
              setRightDigits("");
              setRightMax(0);
              handleReset();
            }}
            onRightDigitsChange={(d) => {
              setRightDigits(d);
              setRightMax(digitMax(d));
              handleReset();
            }}
            onLeftMaxChange={setLeftMax}
            onRightMaxChange={setRightMax}
            onGenerate={handleGenerate}
          />

          {submitted && problems.length > 0 && (
            <ResultCard
              score={score}
              total={problems.length}
              timeMs={finalTime}
              onReset={handleReset}
            />
          )}

          {problems.length > 0 && (
            <ProblemList
              problems={problems}
              answers={answers}
              submitted={submitted}
              elapsed={submitted ? finalTime : stopwatch.elapsed}
              slowIndices={slowIndices}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmit}
              onNext={handleGenerate}
              onReset={handleReset}
            />
          )}

          <ScoreHistory history={history} onClear={clearHistory} />
        </div>
      </main>
    </>
  );
}
