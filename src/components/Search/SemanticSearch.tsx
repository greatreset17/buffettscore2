"use client";

import { useState } from "react";
import { Search, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SearchResult {
  id: number;
  symbol: string;
  name: string;
  description: string;
  similarity: number;
}

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // 1. テキストをベクトル化 (自作 API 経由)
      const vecRes = await fetch("/api/vectorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const { embedding } = await vecRes.json();

      if (!embedding) throw new Error("Failed to generate embedding");

      // 2. Supabase の RPC (match_tickers) を呼び出して類似検索
      const { data, error } = await supabase.rpc("match_tickers", {
        query_embedding: embedding,
        match_threshold: 0.3, // 閾値（適宜調整）
        match_count: 5,        // 上位5件
      });

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Semantic search error:", err);
      alert(`検索エラー: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-surface-container-low backdrop-blur-xl border border-outline-variant/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* 背景の装飾 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary/10 blur-[100px] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/15 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface">AI セマンティック検索</h2>
          </div>

          <p className="text-on-surface-variant mb-8 max-w-2xl">
            事業内容の意味から銘柄を探します。「半導体に関連する企業」「サブスクリプション型のソフトウェア」など、自由な言葉で検索してください。
          </p>

          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索クエリを入力..."
              className="w-full bg-surface-container-high/50 border border-outline-variant/20 rounded-2xl py-4 pl-12 pr-32 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 disabled:bg-surface-container-highest disabled:text-on-surface-variant text-on-primary px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "計算中..." : "検索"}
            </button>
          </form>

          {/* 検索中スケルトン */}
          {loading && (
            <div className="mt-10 space-y-4 animate-fade-in">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-surface-container-high/40 border border-outline-variant/10 rounded-2xl animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="shimmer h-4 w-1/3 rounded-md" />
                    <div className="shimmer h-3 w-2/3 rounded-md" />
                  </div>
                  <div className="shimmer h-6 w-12 rounded-md" />
                </div>
              ))}
            </div>
          )}

          {/* 結果表示 */}
          {!loading && results.length > 0 && (
            <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-semibold text-on-surface-variant/70 uppercase tracking-wider ml-1">
                AIが選んだ関連銘柄
              </h3>
              {results.map((res, i) => (
                <div
                  key={res.symbol}
                  className="flex items-center justify-between p-4 bg-surface-container-high/40 border border-outline-variant/10 hover:border-primary/50 rounded-2xl card-interactive hover:bg-surface-container-high animate-rise-in"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary">{res.symbol}</span>
                      <span className="text-on-surface font-medium">{res.name}</span>
                    </div>
                    {res.description && (
                      <p className="text-sm text-on-surface-variant/70 mt-1 line-clamp-1">{res.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-mono text-sm font-bold">
                      {Math.round(res.similarity * 100)}%
                    </div>
                    <div className="text-[10px] text-on-surface-variant/50 uppercase">Similarity</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="mt-8 text-center py-10 border-2 border-dashed border-outline-variant/20 rounded-2xl">
              <p className="text-on-surface-variant/70">該当する銘柄が見つかりませんでした。</p>
              <p className="text-xs text-on-surface-variant/50 mt-2">
                ※ データベースに説明文とベクトルデータが入っているか確認してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
