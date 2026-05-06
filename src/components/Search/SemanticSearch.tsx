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
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* 背景の装飾 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">AI セマンティック検索</h2>
          </div>

          <p className="text-slate-400 mb-8 max-w-2xl">
            事業内容の意味から銘柄を探します。「半導体に関連する企業」「サブスクリプション型のソフトウェア」など、自由な言葉で検索してください。
          </p>

          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索クエリを入力..."
              className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 pl-12 pr-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "計算中..." : "検索"}
            </button>
          </form>

          {/* 結果表示 */}
          {results.length > 0 && (
            <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">
                AIが選んだ関連銘柄
              </h3>
              {results.map((res) => (
                <div
                  key={res.symbol}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-indigo-500/50 rounded-2xl transition-all hover:bg-white/10"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-indigo-400">{res.symbol}</span>
                      <span className="text-white font-medium">{res.name}</span>
                    </div>
                    {res.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-1">{res.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-indigo-400 font-mono text-sm font-bold">
                      {Math.round(res.similarity * 100)}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Similarity</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="mt-8 text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-500">該当する銘柄が見つかりませんでした。</p>
              <p className="text-xs text-slate-600 mt-2">
                ※ データベースに説明文とベクトルデータが入っているか確認してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
