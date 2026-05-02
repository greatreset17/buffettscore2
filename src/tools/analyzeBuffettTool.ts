import { tool } from "ai";
import { z } from "zod";

export const analyzeBuffettTool = tool({
  description: "ユーザーが特定のティッカーシンボル（例: 2046.T, 7203.T, AAPL）を指定して、その銘柄の『バフェット流の評価』や『詳細分析』を求めた場合にのみ使用します。※検索には絶対に使用しないでください。",
  parameters: z.object({
    ticker: z.string().describe("分析対象のティッカーシンボル（例: 7203.T, AAPL）"),
  }),
  execute: async ({ ticker }) => {
    console.log(`AnalyzeBuffettTool triggered for ticker: ${ticker}`);
    // UIをクラッシュさせないための最低限の有効なデータ構造を返す
    return {
      ticker: ticker,
      name: `${ticker} (分析中...)`,
      price: 0,
      roe: 0,
      debtToEquity: 0,
      grossMargin: 0,
      currentPER: 0,
      businessSummary: `${ticker} のバフェット流分析を開始します。正式な分析結果は現在準備中です。`
    };
  },
});
