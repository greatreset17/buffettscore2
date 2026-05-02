"use server";

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { searchStocksTool } from "@/tools/searchStocksTool";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// モデルチェーン: Gemini が全滅した時のために Gemma を優先フォールバック
const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemma-4-31b-it",
  "gemma-3-27b-it",
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

        const { text, steps } = await (generateText as any)({
          model: google(modelId),
          system: `あなたは投資アナリストです。
銘柄検索ツールを使用して、ユーザーの要望に合う銘柄を提案してください。
検索で見つかった銘柄については、その特徴を分かりやすく解説してください。
もしツールが銘柄を返したなら、必ずその具体的な名前を挙げて説明を書いてください。`,
          prompt: userMessage,
          tools: {
            searchStocks: searchStocksTool,
          },
          maxSteps: 5,
        });

        let searchStocksData = null;
        if (steps) {
          for (const step of steps) {
            if (step.toolResults) {
              for (const result of step.toolResults) {
                if (result.toolName === 'searchStocks') {
                  searchStocksData = result.result;
                }
              }
            }
          }
        }

        // 回答が空っぽ、または短すぎる場合の補完処理
        let finalOutput = text?.trim();
        if (!finalOutput || finalOutput.length < 5) {
          if (searchStocksData && Array.isArray(searchStocksData) && searchStocksData.length > 0) {
            const names = searchStocksData.map((s: any) => `${s.name} (${s.symbol})`).join('、');
            finalOutput = `ご要望のテーマに沿って、${names} などの銘柄を見つけました。詳細は以下のカードをご覧ください。`;
          } else {
            finalOutput = text || "条件に合う銘柄が見つかりませんでした。";
          }
        }

        return { 
          output: finalOutput, 
          toolStocks: searchStocksData ? JSON.parse(JSON.stringify(searchStocksData)) : null,
          toolAnalysis: null
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
