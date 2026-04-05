"use client";

import { useState, useRef, useCallback } from "react";

export function formatTime(ms: number): string {
  const tenths = Math.floor(ms / 100);
  const mins = Math.floor(tenths / 600);
  const secs = Math.floor((tenths % 600) / 10);
  const dec = tenths % 10;
  return `${mins}:${String(secs).padStart(2, "0")}.${dec}`;
}

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    startRef.current = Date.now() - elapsed;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);
  }, [elapsed]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
    setRunning(false);
  }, []);

  return { elapsed, running, start, stop, reset };
}
