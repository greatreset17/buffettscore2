"use client";

import React, { useState, useEffect } from "react";
import { StockCardList } from "./StockCardList";
import { AnalysisReport } from "./AnalysisReport";
import { getStocksAction, getAnalysisAction } from "@/app/discover/fetch-actions";

interface AiChatResponseProps {
  content: string;
  toolStocks?: any[];
  toolAnalysis?: any;
}

export function AiChatResponse({ content, toolStocks, toolAnalysis }: AiChatResponseProps) {
  const [stocks, setStocks] = useState<any[] | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 既に取得済みかロード中なら何もしない
    if (stocks || report || isLoading) return;

    // ツールから直接銘柄リストが渡されている場合はそれを使用する（検索ツールの結果）
    if (toolStocks && toolStocks.length > 0) {
      setStocks(toolStocks);
      return;
    }

    // ツールから直接分析データが渡されている場合はそれを使用する（分析ツールの結果）
    if (toolAnalysis) {
      setReport(toolAnalysis);
      return;
    }

    // 命令タグが含まれているかチェック
    const searchMatch = content.match(/search\((?:query=)?["']([^"']+)["']\)/i);
    const analyzeMatch = content.match(/analyze\((?:query=)?["']([^"']+)["']\)/i);

    if (!searchMatch && !analyzeMatch) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        if (searchMatch) {
          const data = await getStocksAction(searchMatch[1]);
          setStocks(data);
        } else if (analyzeMatch) {
          const data = await getAnalysisAction(analyzeMatch[1]);
          setReport(data);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
        setError("データの取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [content]); // contentが更新されるたびに再評価（ストリーミング完了後に安定する）

  // 表示用のテキストから技術的なタグを削除
  const displayContent = content
    .replace(/search\((?:query=)?["']([^"']+)["']\)/gi, "")
    .replace(/analyze\((?:query=)?["']([^"']+)["']\)/gi, "")
    .trim();

  return (
    <div className="space-y-4">
      {displayContent && (
        <div className="prose prose-sm max-w-none px-2 text-on-surface whitespace-pre-wrap leading-relaxed animate-fade-in">
          {displayContent}
        </div>
      )}

      {(stocks || report || isLoading || error) && (
        <div className="mt-2 animate-fade-in border-t border-outline-variant/10 pt-4">
          {isLoading && (
            <div className="flex items-center gap-3 p-4 opacity-50">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <span className="text-xs font-label">バフェット流に分析中...</span>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-xs text-danger bg-danger/5 rounded-xl border border-danger/10">
              {error}
            </div>
          )}

          {stocks && <StockCardList stocks={stocks} />}
          {report && <AnalysisReport data={report} />}
        </div>
      )}
    </div>
  );
}
