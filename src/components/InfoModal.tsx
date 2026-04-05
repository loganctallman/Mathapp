"use client";

import { useState } from "react";

export default function InfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Info button */}
      <div className="relative group">
        <button
          onClick={() => setOpen(true)}
          aria-label="Info"
          className="w-7 h-7 rounded-full glass-sm flex items-center justify-center
            text-white/40 hover:text-white/80 hover:brightness-125
            transition-all duration-200 hover:scale-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
          </svg>
        </button>
        {/* Hover tooltip */}
        <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2
          text-[10px] font-bold uppercase tracking-widest text-white/40
          opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
          Info
        </span>
      </div>

      {/* Backdrop + modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal card */}
          <div className="relative glass rounded-2xl p-8 max-w-lg w-full shadow-[0_24px_64px_rgba(0,0,0,0.6)]
            animate-fade-up">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-7 h-7 rounded-full glass-sm flex items-center justify-center
                text-white/40 hover:text-white/80 hover:brightness-125
                transition-all duration-200 hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <h3 className="gradient-text text-xl font-black uppercase tracking-tight mb-4">
              Math Trainer
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-medium">
              Master your mental math with a trainer that adapts to you. Whether you&apos;re a student
              sharpening your skills or an adult staying sharp, Math Trainer lets you dictate the
              challenge. Select a Mode from Addition, Subtraction, Multiplication, or Division, and
              dial in the difficulty by selecting the exact number of digits for every problem. No
              fluff, no distractions—just 20-problem sets designed to build speed and accuracy.
              Solve, submit, and see your results and progress instantly.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
