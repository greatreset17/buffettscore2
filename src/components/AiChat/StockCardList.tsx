"use client";

import React from "react";
import { StockCard } from "./StockCard";
import type { StockCardData } from "./StockCard";

interface StockCardListProps {
  stocks: StockCardData[];
  onAnalyze?: (ticker: string) => void;
}

export function StockCardList({ stocks, onAnalyze }: Readonly<StockCardListProps>) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="material-symbols-outlined text-primary text-lg"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          library_books
        </span>
        <span className="text-on-surface font-label text-xs font-bold uppercase tracking-widest">
          {stocks.length} 件の銘柄が見つかりました
        </span>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 gap-3">
        {stocks.map((stock, i) => (
          <div
            key={stock.id}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <StockCard stock={stock} onAnalyze={onAnalyze} />
          </div>
        ))}
      </div>

      {/* Tip */}
      <p className="text-center text-[10px] text-on-surface-variant/50 font-label mt-2">
        カードをクリックして、バフェット流の詳細評価を受けましょう
      </p>
    </div>
  );
}
