"use client";

import React, { useState, useEffect, useRef } from "react";
import { STOCK_INPUT_CONTENT } from "@/data/mockData";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── types ────────────────────────────────────────────
interface SearchHubProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

interface TickerResult {
  ticker: string;
  name: string;
  exch: string;
  type: string;
}

interface SemanticResult {
  id: number;
  symbol: string;
  name: string;
  description: string;
  similarity: number;
}

type Mode = "ticker" | "ai";

// ─── component ────────────────────────────────────────
export const SearchHub: React.FC<Readonly<SearchHubProps>> = ({
  onSearch,
  isLoading,
}) => {
  const [mode, setMode] = useState<Mode>("ticker");

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in delay-100">
      {/* ── Top-Level Mode Tabs ── */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm">
          <button
            onClick={() => setMode("ticker")}
            className={`flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-label font-bold tracking-wider transition-all duration-300 ${
              mode === "ticker"
                ? "bg-surface-container-high text-primary shadow-lg ring-1 ring-primary/20"
                : "text-on-surface-variant/60 hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">search</span>
            銘柄指定
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-label font-bold tracking-wider transition-all duration-300 ${
              mode === "ai"
                ? "bg-surface-container-high text-primary shadow-lg ring-1 ring-primary/20"
                : "text-on-surface-variant/60 hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              auto_awesome
            </span>
            AIテーマ検索
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative min-h-[280px]">
        {/* Ticker Mode */}
        <div
          className={`transition-all duration-400 ease-out ${
            mode === "ticker"
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none absolute inset-0"
          }`}
        >
          <TickerSearch onSearch={onSearch} isLoading={isLoading} />
        </div>

        {/* AI Mode */}
        <div
          className={`transition-all duration-400 ease-out ${
            mode === "ai"
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none absolute inset-0"
          }`}
        >
          <AIThemeSearch onSearch={onSearch} />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  Tab 1: Ticker Search (既存 DiagnosisInput の中身を移植)
// ═══════════════════════════════════════════════════════
function TickerSearch({
  onSearch,
  isLoading,
}: {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}) {
  const [ticker, setTicker] = useState("");
  const [activeTab, setActiveTab] = useState("日本株");
  const [progress, setProgress] = useState(0);
  const [suggestions, setSuggestions] = useState<TickerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Reset on first tick when loading starts
        if (prev >= 90) return Math.random() * 10;
        return prev < 90 ? prev + Math.random() * 10 : prev;
      });
    }, 500);
    return () => {
      clearInterval(interval);
      setProgress(0);
    };
  }, [isLoading]);

  const handleTickerChange = (value: string) => {
    setTicker(value);
    if (value.length <= 1) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (ticker.length > 1) {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          const marketParam = activeTab === "日本株" ? "JP" : "US";
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(ticker)}&market=${marketParam}`
          );
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Search error:", err);
        }
      }, 500);
    }
  }, [ticker, activeTab]);

  const handleSelect = (symbol: string) => {
    setTicker(symbol);
    setShowSuggestions(false);
    onSearch(symbol);
  };

  return (
    <div className="space-y-6">
      {/* Market Sub-tabs */}
      <div className="flex justify-center p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
        {STOCK_INPUT_CONTENT.cta.tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-5 rounded-lg text-xs font-label font-bold tracking-widest uppercase transition-all duration-300 ${
              activeTab === tab
                ? "bg-surface-container-high text-primary shadow-md ring-1 ring-primary/20"
                : "text-on-surface-variant/60 hover:text-on-surface"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="relative group z-50">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary-container/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
        <div className="relative flex flex-col items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-surface-container-lowest border-none text-center text-sm sm:text-lg md:text-xl font-sans font-semibold py-5 px-4 rounded-xl focus:ring-0 placeholder:text-outline-variant/50 placeholder:font-light text-on-surface shadow-inner"
              placeholder={STOCK_INPUT_CONTENT.cta.placeholder}
            />

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                {suggestions.map((item) => (
                  <div
                    key={item.ticker}
                    onClick={() => handleSelect(item.ticker)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-primary/5 cursor-pointer border-b border-outline-variant/5 group/item transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-on-surface text-lg group-hover/item:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                        {item.ticker} · {item.exch}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-primary opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100">
                      add_circle
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 w-full flex flex-col items-center">
            <button
              onClick={() => onSearch(ticker)}
              disabled={isLoading || !ticker}
              className="w-full md:w-auto md:px-16 py-4 bg-primary-container text-on-primary font-bold text-base tracking-widest rounded-md hover:scale-[0.98] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="group-hover:translate-x-[-2px] transition-transform">
                {isLoading ? "分析中..." : "採点する"}
              </span>
              <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
                {isLoading ? "sync" : "insights"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isLoading && (
        <div className="mt-8 w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 rounded-xl bg-surface-container-low border-l-4 border-primary/40 relative overflow-hidden shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-1">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="font-label font-bold text-xs uppercase tracking-[0.2em] text-primary mb-2">
                  System Status
                </h3>
                <p className="text-on-surface font-body italic text-lg transition-all duration-500">
                  {progress < 30
                    ? "Fetching market data..."
                    : progress < 60
                    ? "Analysing financial statements..."
                    : "Calculating Moat Score..."}
                </p>
                <div className="mt-4 w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-label font-medium uppercase tracking-tighter text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-xs ${
                        progress > 40 ? "text-primary" : "text-outline-variant"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {progress > 40 ? "check_circle" : "pending"}
                    </span>
                    <span>Market Data Retrieval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-xs ${
                        progress > 70 ? "text-primary" : "text-outline-variant"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {progress > 70 ? "check_circle" : "pending"}
                    </span>
                    <span>Intrinsic Valuation</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Tab 2: AI Theme Search (セマンティック検索)
// ═══════════════════════════════════════════════════════
function AIThemeSearch({ onSearch }: { onSearch: (ticker: string) => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const vecRes = await fetch("/api/vectorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const { embedding } = await vecRes.json();
      if (!embedding) throw new Error("Failed to generate embedding");

      const { data, error } = await supabase.rpc("match_tickers", {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 5,
      });
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Semantic search error:", err);
      alert(
        `検索エラー: ${err instanceof Error ? err.message : JSON.stringify(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="flex items-center gap-3 justify-center">
        <span
          className="material-symbols-outlined text-primary text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <p className="text-on-surface-variant font-body text-sm leading-relaxed">
          事業内容の<strong className="text-on-surface">意味</strong>
          から銘柄を検索します。自然な言葉で条件を入力してください。
        </p>
      </div>

      {/* Textarea + Submit */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary-container/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="relative w-full bg-surface-container-lowest border-none text-sm sm:text-base font-body py-5 px-6 rounded-xl focus:ring-0 placeholder:text-outline-variant/50 placeholder:font-light text-on-surface shadow-inner resize-none leading-relaxed"
            placeholder="例：不況に強く、配当が安定している企業"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full md:w-auto md:px-16 py-4 bg-primary-container text-on-primary font-bold text-base tracking-widest rounded-md hover:scale-[0.98] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="group-hover:translate-x-[-2px] transition-transform">
              {loading ? "AI分析中..." : "テーマで検索"}
            </span>
            <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
              {loading ? "sync" : "auto_awesome"}
            </span>
          </button>
        </div>
      </form>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in duration-300">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest">
            Embedding & Similarity Search...
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-primary ml-1">
            AIが選んだ関連銘柄
          </h3>
          {results.map((res) => (
            <div
              key={res.symbol}
              onClick={() => onSearch(res.symbol)}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-sans font-bold text-primary text-sm">
                    {res.symbol}
                  </span>
                  <span className="font-sans font-semibold text-on-surface text-base group-hover:text-primary transition-colors">
                    {res.name}
                  </span>
                </div>
                {res.description && (
                  <p className="text-xs text-on-surface-variant font-body line-clamp-1 max-w-md">
                    {res.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-sans font-bold text-primary text-sm tabular-nums">
                  {Math.round(res.similarity * 100)}%
                </span>
                <span className="text-[9px] font-label text-on-surface-variant uppercase tracking-widest">
                  match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-outline-variant/10 rounded-2xl animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-3 block">
            search_off
          </span>
          <p className="text-on-surface-variant text-sm">
            該当する銘柄が見つかりませんでした。
          </p>
          <p className="text-xs text-outline-variant mt-1">
            ※ データベースに説明文とベクトルデータが入っているか確認してください。
          </p>
        </div>
      )}
    </div>
  );
}
