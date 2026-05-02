import { tool } from "ai";
import { z } from "zod";
import yf from "yahoo-finance2";

// yahoo-finance2 の初期化 (ESM/CJSの差異を吸収)
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

export const analyzeStockTool = tool({
  description: "特定の1銘柄（ティッカー指定）のバフェット流評価を行うためのツールです。",
  parameters: z.object({
    ticker: z.string().describe("分析対象のティッカーシンボル（例: 7203.T, AAPL）"),
  }),
  execute: async ({ ticker }) => {
    try {
      console.log(`Analyzing stock: ${ticker}`);
      const symbol = ticker.replace(/[()"' ]/g, "").toUpperCase();
      
      // Yahoo Financeからデータを取得
      const [quote, financials] = await Promise.all([
        yahooFinance.quote(symbol).catch(() => null),
        yahooFinance.quoteSummary(symbol, {
          modules: ["financialData", "summaryDetail", "assetProfile"],
        }).catch(() => null),
      ]) as any[];

      if (!quote && !financials) {
        throw new Error(`銘柄 ${symbol} のデータが見つかりませんでした。`);
      }

      const result = {
        ticker: symbol,
        name: quote?.longName || quote?.shortName || symbol,
        price: quote?.regularMarketPrice || 0,
        roe: (financials?.financialData?.returnOnEquity || 0) * 100,
        debtToEquity: financials?.financialData?.debtToEquity || 0,
        grossMargin: (financials?.financialData?.grossMargins || 0) * 100,
        currentPER: quote?.trailingPE || financials?.summaryDetail?.trailingPE || 0,
        businessSummary: financials?.assetProfile?.longBusinessSummary || "事業内容の詳細データが取得できませんでした。",
      };

      console.log(`Analysis data fetched for ${symbol}`);
      return result;
    } catch (error: any) {
      console.error("Analyze Stock Tool Error:", error);
      throw error;
    }
  },
});
