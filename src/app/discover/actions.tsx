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
  // 【究極の物理ハーネス】分析コマンドの場合はAI（LLM）を介さずに直接ツールを実行
  if (userMessage.startsWith("【分析コマンド】TARGET_TICKER:")) {
    console.log("Direct Routing: Bypassing LLM for Analysis Command");
    const parts = userMessage.split("TARGET_TICKER:")[1].trim().split(" ");
    const ticker = parts[0].trim();
    
    const analysisData = await analyzeBuffettTool.execute({ ticker }, { toolCallId: "direct-eval", messages: [] });
    return {
      output: `${ticker} の詳細分析レポートを直接生成しました。`,
      toolStocks: null,
      toolAnalysis: analysisData
    };
  }

  let modelIndex = 0;
  let lastError: any = null;

  for (let attempt = 0; attempt < MODEL_CHAIN.length; attempt++) {
    const modelId = MODEL_CHAIN[modelIndex];

    try {
      console.log(`Attempting with model: ${modelId}`);
      
      const { text, steps } = await generateText({
        model: google(modelId),
        system: `あなたは厳格なアナリストです。
銘柄を提案する際は、必ず searchStocksHybrid ツールが返したJSONデータの description（事業内容）と roe を根拠として引用し、なぜ合致するのか説明してください。
ツールから返ってきたデータ以外の銘柄（自身の知識）は絶対に喋ってはいけません。
該当データが0件の場合は「データベースに条件に合う銘柄がありませんでした」と答えてください。`,
        prompt: userMessage,
        // 検索時は検索ツールのみを提供し、誤爆を防ぐ
        tools: {
          searchStocksHybrid: searchStocksTool,
        },
        maxSteps: 3,
        maxRetries: 0,
      });

      let searchStocksData = null;
      let toolAnalysisData = null;
      
      if (steps) {
        for (const step of steps) {
          if (step.toolResults) {
            for (const result of step.toolResults) {
              if (result.toolName === 'searchStocksHybrid') {
                searchStocksData = Array.isArray(result.result) ? result.result : (result.result?.value || null);
              }
            }
          }
        }
      }

      let finalOutput = text || "";
      
      // 自動リカバリ
      if (!finalOutput && !searchStocksData) {
        searchStocksData = await searchStocksTool.execute({ query: userMessage }, { toolCallId: "auto-recovery", messages: [] });
        finalOutput = "条件に合う銘柄を検索しました。";
      }

      return { 
        output: finalOutput, 
        toolStocks: searchStocksData,
        toolAnalysis: toolAnalysisData
      };
    } catch (err: any) {
      console.error(`Error with ${modelId}:`, err);
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
        modelIndex++;
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("AI呼び出しに失敗しました。");
}
