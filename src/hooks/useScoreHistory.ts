"use client";

import { useState, useEffect } from "react";
import { Mode } from "@/utils/mathLogic";

export interface HistoryEntry {
  id: string;
  date: number;
  mode: Mode;
  leftDigits: number;
  rightDigits: number;
  score: number;
  total: number;
  timeMs: number;
}

const STORAGE_KEY = "math-trainer-history";

export function useScoreHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  function addEntry(entry: Omit<HistoryEntry, "id" | "date">) {
    const next: HistoryEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      date: Date.now(),
    };
    setHistory((prev) => {
      const updated = [next, ...prev].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return { history, addEntry, clearHistory };
}
