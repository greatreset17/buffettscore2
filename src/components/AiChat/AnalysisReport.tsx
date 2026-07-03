"use client";

import React from "react";
import Link from "next/link";

interface AnalysisData {
  ticker: string;
  name: string;
  price: number;
  roe: number;
  debtToEquity: number;
  grossMargin: number;
  currentPER: number;
  businessSummary: string;
}

function gradeMetric(label: string, value: number): { grade: string; color: string } {
  if (label === "ROE") {
    if (value >= 20) return { grade: "S", color: "text-success" };
    if (value >= 15) return { grade: "A", color: "text-success/80" };
    if (value >= 10) return { grade: "B", color: "text-warning" };
    return { grade: "C", color: "text-danger" };
  }
  if (label === "PER") {
    if (value > 0 && value <= 12) return { grade: "S", color: "text-success" };
    if (value <= 18) return { grade: "A", color: "text-success/80" };
    if (value <= 25) return { grade: "B", color: "text-warning" };
    return { grade: "C", color: "text-danger" };
  }
  if (label === "粗利率") {
    if (value >= 40) return { grade: "S", color: "text-success" };
    if (value >= 25) return { grade: "A", color: "text-success/80" };
    if (value >= 15) return { grade: "B", color: "text-warning" };
    return { grade: "C", color: "text-danger" };
  }
  if (label === "D/E") {
    if (value <= 30) return { grade: "S", color: "text-success" };
    if (value <= 80) return { grade: "A", color: "text-success/80" };
    if (value <= 150) return { grade: "B", color: "text-warning" };
    return { grade: "C", color: "text-danger" };
  }
  return { grade: "B", color: "text-warning" };
}

export function AnalysisReport({ data }: Readonly<{ data: AnalysisData }>) {
  const metrics = [
    { 
      label: "ROE", 
      value: data.roe, 
      display: typeof data.roe === 'number' ? `${data.roe.toFixed(1)}%` : '-' 
    },
    { 
      label: "PER", 
      value: data.currentPER, 
      display: typeof data.currentPER === 'number' ? `${data.currentPER.toFixed(1)}x` : '-' 
    },
    { 
      label: "粗利率", 
      value: data.grossMargin, 
      display: typeof data.grossMargin === 'number' ? `${data.grossMargin.toFixed(1)}%` : '-' 
    },
    { 
      label: "D/E", 
      value: data.debtToEquity, 
      display: typeof data.debtToEquity === 'number' ? `${data.debtToEquity.toFixed(1)}` : '-' 
    },
  ];

  // Simple overall score calculation
  const scores = metrics.map((m) => {
    const { grade } = gradeMetric(m.label, m.value);
    return grade === "S" ? 95 : grade === "A" ? 80 : grade === "B" ? 60 : 35;
  });
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return (
    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-5 border-b border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {data.ticker?.substring(0, 2) || "評価"}
              </span>
            </div>
            <div>
              <h3 className="font-sans font-bold text-on-surface text-base">
                {data.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-primary font-mono text-xs font-semibold">
                  {data.ticker}
                </span>
                {data.price > 0 && (
                  <span className="text-on-surface-variant text-xs">
                    ¥{data.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                avgScore >= 80
                  ? "border-success text-success"
                  : avgScore >= 60
                    ? "border-warning text-warning"
                    : "border-danger text-danger"
              }`}
            >
              <span className="font-bold text-xl">{avgScore}</span>
            </div>
            <span className="text-[9px] text-on-surface-variant font-label mt-1 uppercase tracking-wider">
              Score
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-outline-variant/5">
        {metrics.map((m) => {
          const { grade, color } = gradeMetric(m.label, m.value);
          return (
            <div
              key={m.label}
              className="bg-surface-container-low p-4 text-center"
            >
              <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">
                {m.label}
              </span>
              <p className="text-on-surface font-bold text-lg mt-1">
                {m.display}
              </p>
              <span className={`text-xs font-bold ${color}`}>Grade {grade}</span>
            </div>
          );
        })}
      </div>

      {/* Business Summary */}
      <div className="p-5 border-t border-outline-variant/5">
        <h4 className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mb-2">
          事業概要
        </h4>
        <p className="text-on-surface text-xs leading-relaxed line-clamp-4">
          {data.businessSummary !== "N/A"
            ? data.businessSummary.substring(0, 300) + "..."
            : "事業概要は取得できませんでした。"}
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          href={`/analyze/${data.ticker}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary rounded-xl text-xs font-label font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
          フル分析レポートを見る
        </Link>
      </div>
    </div>
  );
}
