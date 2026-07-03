"use client";
import React, { useEffect, useState } from 'react';
import { SCORING_RESULTS_MOCK } from "@/data/mockData";

export const StockHeader: React.FC<{ ticker: string; name?: string }> = ({ ticker, name }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-2 animate-fade-in group pb-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-lg mb-2">
        <span className="font-label font-bold text-primary tracking-tighter">{ticker}</span>
        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
        <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">Market Analysis</span>
      </div>
      <h2 className="font-sans text-2xl md:text-3xl font-bold text-on-surface leading-tight tracking-tight px-4 transition-all group-hover:scale-[1.01] max-w-sm mx-auto">
        {name || "Company Name Reference"}
      </h2>
    </div>
  );
};

const COUNT_DURATION = 1200;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const ScoreCard: React.FC<{ score: number; summary?: string }> = ({ score, summary }) => {
  const dashArray = 283;
  const targetOffset = dashArray - (dashArray * score) / 100;

  // SSR-safe initial state: 0 / empty gauge on both server and first client render
  const [displayScore, setDisplayScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(dashArray);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
        // First frame after initial paint: kick off the gauge CSS transition
        setDashOffset(targetOffset);
      }
      const t = Math.min((now - startTime) / COUNT_DURATION, 1);
      setDisplayScore(Math.round(easeOutCubic(t) * score));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setSettled(true);
      }
    };

    // Double rAF so the initial (empty) gauge state is painted before transitioning
    rafId = requestAnimationFrame(() => {
      if (prefersReduced) {
        // Skip the count-up; the global reduced-motion guard also disables the gauge transition
        setDisplayScore(score);
        setDashOffset(targetOffset);
        return;
      }
      rafId = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafId);
  }, [score, targetOffset]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center pb-4">
        {/* Golden Circle Progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle 
            className="text-surface-container-high" 
            cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="2"
          />
          <circle
            cx="50" cy="50" fill="none" r="45"
            stroke="url(#scoreGradient)"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="4"
            className="gauge-progress"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--gold-bright)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'var(--gold)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="text-center z-10">
          <span className={`font-sans font-extrabold text-7xl md:text-8xl text-primary block leading-none tabular-nums ${settled ? 'animate-score-settle' : ''}`}>
            {displayScore}
          </span>
          <span className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/40 mt-2 block">
            Buffett Score
          </span>
        </div>
      </div>
      
      <p className="mt-8 text-on-surface-variant font-body text-sm text-center leading-relaxed max-w-md">
        {summary || SCORING_RESULTS_MOCK.summary}
      </p>
    </div>
  );
};
