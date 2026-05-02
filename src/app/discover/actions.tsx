"use server";

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { searchStocksTool } from "@/tools/searchStocksTool";
import { analyzeBuffettTool } from "@/tools/analyzeBuffettTool";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemma-4-31b-it",
] as const;

export async function askAI(userMessage: string) {
  try {
    console.log("Ultra-Simple Test Mode");
    
    // AIを呼び出さず、まずはエコーバック（オウム返し）で疎通確認
    return {
      output: `「${userMessage}」を受け付けました。現在デバッグモードで動作しています。`,
      toolStocks: null,
      toolAnalysis: null
    };
  } catch (error: any) {
    return {
      output: `クリティカルエラー: ${error.message}`,
      toolStocks: null,
      toolAnalysis: null
    };
  }
}
