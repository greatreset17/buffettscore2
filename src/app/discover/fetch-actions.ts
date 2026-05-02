"use server";

import { createClient } from "@supabase/supabase-js";
import yf from "yahoo-finance2";

// yahoo-finance2 の初期化
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function vectorize(text: string): Promise<number[]> {
  const { pipeline } = await import("@xenova/transformers");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as any);
}

export async function getStocksAction(query: string) {
  try {
    const vector = await vectorize(query);
    const { data, error } = await supabase.rpc("match_tickers", {
      query_embedding: vector,
      match_threshold: 0.1, // より広く拾う
      match_count: 8,
    });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("getStocksAction error:", e);
    return [];
  }
}

export async function getAnalysisAction(ticker: string) {
  try {
    const symbol = ticker.replace(/[()"' ]/g, "").toUpperCase();
    const [quote, financials] = await Promise.all([
      yahooFinance.quote(symbol).catch(() => null),
      yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "summaryDetail", "assetProfile"],
      }).catch(() => null),
    ]) as any[];

    return {
      ticker: symbol,
      name: quote?.longName || quote?.shortName || symbol,
      price: quote?.regularMarketPrice || 0,
      roe: (financials?.financialData?.returnOnEquity || 0) * 100,
      debtToEquity: financials?.financialData?.debtToEquity || 0,
      grossMargin: (financials?.financialData?.grossMargins || 0) * 100,
      currentPER: quote?.trailingPE || financials?.summaryDetail?.trailingPE || 0,
      businessSummary: financials?.assetProfile?.longBusinessSummary || "事業内容の詳細データが取得できませんでした。",
    };
  } catch (e) {
    console.error("getAnalysisAction error:", e);
    return {
      ticker: ticker,
      name: ticker,
      price: 0, roe: 0, debtToEquity: 0, grossMargin: 0, currentPER: 0,
      businessSummary: "データの取得中にエラーが発生しました。",
    };
  }
}
