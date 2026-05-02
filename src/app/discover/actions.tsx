"use server";

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { searchStocksTool } from "@/tools/searchStocksTool";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

export async function askAI(userMessage: string) {
  try {
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { output: "エラー: AI APIキーが設定されていません。", toolStocks: null, toolAnalysis: null };
    }

    let modelIndex = 0;
    let lastError: any = null;

    for (const modelId of MODEL_CHAIN) {
      try {
        const { text, steps } = await (generateText as any)({
          model: google(modelId),
          system: `あなたはバフェット流の投資アナリストです。
銘柄提案の際は、必ず提供されたデータを根拠にしてください。
検索結果が0件の場合は「条件に合う銘柄がありませんでした」と回答してください。`,
          prompt: userMessage,
          tools: {
            searchStocks: searchStocksTool,
          },
          maxSteps: 3,
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
        console.error(`Error with ${modelId}:`, err);
        lastError = err;
        if (err?.status === 429) continue;
        break;
      }
    }
    throw lastError || new Error("AI呼び出しに失敗しました。");
  } catch (error: any) {
    console.error("ASK_AI_ERROR:", error);
    return {
      output: `エラーが発生しました: ${error.message}`,
      toolStocks: null,
      toolAnalysis: null
    };
  }
}
