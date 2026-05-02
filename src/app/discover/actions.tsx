"use server";

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { searchStocksTool } from "@/tools/searchStocksTool";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// モデルチェーン: Gemini が全滅した時のために Gemma を最後に追加
const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite-preview-02-05", // 最新の Lite
  "gemma-3-27b-it",                      // Gemma 3
  "gemma-4-31b-it",                      // Gemma 4 (最強の控え)
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
        
        const { text, steps } = await (generateText as any)({
          model: google(modelId),
          system: `あなたはウォーレン・バフェット流の投資家です。
誠実で冷静な口調で回答してください。
検索ツールを使って銘柄を探し、その結果に基づいて提案を行ってください。`,
          prompt: userMessage,
          tools: {
            searchStocks: searchStocksTool,
          },
          maxSteps: 5, // ツール呼び出しを確実に行わせるため少し増やす
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

        return { 
          output: text || "検索結果をまとめました。", 
          toolStocks: searchStocksData ? JSON.parse(JSON.stringify(searchStocksData)) : null,
          toolAnalysis: null
        };
      } catch (err: any) {
        console.error(`Error with ${modelId}:`, err.message || err);
        lastError = err;
        // どんなエラーでも次のモデルに望みを託す
        continue;
      }
    }
    
    throw lastError || new Error("すべてのAIモデルでエラーが発生しました。");
  } catch (error: any) {
    console.error("FINAL_ASK_AI_ERROR:", error);
    return {
      output: `申し訳ありません。現在全てのAIモデルが混み合っているか制限に達しています。しばらく時間をおいてから再度お試しください。\n\n詳細: ${error.message}`,
      toolStocks: null,
      toolAnalysis: null
    };
  }
}
