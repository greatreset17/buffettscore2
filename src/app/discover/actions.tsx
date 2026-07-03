"use server";

import { generateText, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { searchStocksTool } from "@/tools/searchStocksTool";
import { analyzeStockTool } from "@/tools/analyzeStockTool";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// モデルチェーン: Gemini が全滅した時のために Gemma を優先フォールバック
const MODEL_CHAIN = [
  "gemini-3.1-flash-lite",
  "gemma-4-31b-it",
  "gemma-4-26b-it",
] as const;

export async function askAI(userMessage: string) {
  try {
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { output: "エラー: AI APIキーが設定されていません。", toolStocks: null, toolAnalysis: null };
    }

    let lastError: any = null;

    for (const modelId of MODEL_CHAIN) {
      try {
        console.log(`Trying AI request with model: ${modelId}...`);
        
        const isGemma = modelId.startsWith("gemma");

        const { text, steps } = await generateText({
          model: google(modelId),
          system: `あなたは投資アナリストです。ツールの使い分けルール:
1. メッセージに「【分析コマンド】TARGET_TICKER: XXX」が含まれる場合、または特定のティッカーシンボル（例: AAPL, 7203.T）の詳細分析を求められた場合は、必ず analyzeStock ツールをそのティッカーで呼び出してください。searchStocks は使わないでください。
2. テーマやキーワード（例: 半導体、AI関連）で銘柄を探す要望には searchStocks ツールを使ってください。
検索で見つかった銘柄については、必ずその具体的な名前を挙げて特徴を分かりやすく解説してください。
分析ツールの結果は画面にカードとして表示されるため、数値の羅列は不要です。要点を短く解説してください。`,
          prompt: userMessage,
          tools: {
            searchStocks: searchStocksTool,
            analyzeStock: analyzeStockTool,
          },
          // AI SDK v5以降では maxSteps ではなく stopWhen を使う
          // (maxSteps だとツール実行後に回答テキストが生成されずに終了してしまう)
          stopWhen: stepCountIs(5),
        });

        let searchStocksData = null;
        let analyzeStockData = null;
        if (steps) {
          for (const step of steps) {
            if (step.toolResults) {
              for (const result of step.toolResults) {
                // AI SDK v5以降ではツールの戻り値は result ではなく output に入る
                if (result.toolName === 'searchStocks') {
                  searchStocksData = result.output;
                } else if (result.toolName === 'analyzeStock') {
                  analyzeStockData = result.output;
                }
              }
            }
          }
        }

        // 回答が空っぽ、または短すぎる場合の補完処理
        let finalOutput = text?.trim();
        if (!finalOutput || finalOutput.length < 5) {
          if (analyzeStockData) {
            finalOutput = `${analyzeStockData.name} (${analyzeStockData.ticker}) の分析結果をまとめました。詳細は以下のレポートをご覧ください。`;
          } else if (searchStocksData && Array.isArray(searchStocksData) && searchStocksData.length > 0) {
            const names = searchStocksData.map((s: any) => `${s.name} (${s.symbol})`).join('、');
            finalOutput = `ご要望のテーマに沿って、${names} などの銘柄を見つけました。詳細は以下のカードをご覧ください。`;
          } else {
            finalOutput = text || "条件に合う銘柄が見つかりませんでした。";
          }
        }

        return {
          output: finalOutput,
          toolStocks: searchStocksData ? JSON.parse(JSON.stringify(searchStocksData)) : null,
          toolAnalysis: analyzeStockData ? JSON.parse(JSON.stringify(analyzeStockData)) : null
        };
      } catch (err: any) {
        console.error(`Error with ${modelId}:`, err.message || err);
        lastError = err;
        continue;
      }
    }
    
    throw lastError || new Error("AI呼び出しに失敗しました。");
  } catch (error: any) {
    console.error("FINAL_ASK_AI_ERROR:", error);
    return {
      output: `エラーが発生しました: ${error.message}`,
      toolStocks: null,
      toolAnalysis: null
    };
  }
}
