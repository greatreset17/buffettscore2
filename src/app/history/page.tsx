"use client";

import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HistoryItem {
  id: string;
  ticker: string;
  name: string;
  score: number;
  date: string;
  type: 'US' | 'JP';
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<'All' | 'US' | 'JP'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buffett_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate: Keep only the latest analysis for each ticker
      const deduplicated: Record<string, HistoryItem> = {};
      data.forEach((row: any) => {
        const ticker = row.ticker;
        if (!deduplicated[ticker]) {
          deduplicated[ticker] = {
            id: row.id,
            ticker: ticker,
            name: row.analysis_result?.name || ticker,
            score: row.analysis_result?.score || 0,
            date: new Date(row.created_at).toLocaleDateString(),
            type: ticker.endsWith('.T') ? 'JP' : 'US',
          };
        }
      });

      setHistory(Object.values(deduplicated));
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history
    .filter(item => filter === 'All' || item.type === filter)
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.score - a.score;
    });

  const handleDelete = async (ticker: string) => {
    try {
      const { error } = await supabase
        .from('buffett_analyses')
        .delete()
        .eq('ticker', ticker);
      
      if (error) throw error;
      setHistory(prev => prev.filter(item => item.ticker !== ticker));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1 items-center text-center">
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-on-surface">
            分析アーカイブ
          </h2>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 border-y border-outline-variant/10">
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl border border-outline-variant/5">
            {['All', 'US', 'JP'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-surface-container-highest text-primary shadow-sm' 
                    : 'text-on-surface-variant/60 hover:text-on-surface'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">並び替え:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface-container-low border-none rounded-lg text-[10px] font-label font-bold uppercase tracking-widest text-primary focus:ring-0 cursor-pointer"
            >
              <option value="date">最新順</option>
              <option value="score">スコア順</option>
            </select>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <p className="font-sans text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">履歴を読み込み中...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item, idx) => (
              <div 
                key={item.ticker}
                className="group relative bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm card-interactive hover:border-primary/20 animate-rise-in"
                style={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
              >
                <div className="flex justify-between items-center">
                  <Link href={`/analyze/${item.ticker}`} className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                          {item.ticker} · {item.type}
                        </span>
                        <h4 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <span className="font-label text-[9px] text-on-surface-variant/60 mt-1 uppercase tracking-tighter">
                          診断日: {item.date}
                        </span>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="font-headline text-3xl font-bold text-primary italic leading-none">{item.score}</span>
                      <span className="font-label text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">スコア</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.ticker)}
                      className="p-2 text-on-surface-variant opacity-20 hover:opacity-100 hover:text-error transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/20 rounded-r-full group-hover:bg-primary transition-colors"></div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-40">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">history_toggle_off</span>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-on-surface-variant">履歴が見つかりません。</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
