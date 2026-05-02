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
    // 0. 環境変数のチェック（本番環境での設定漏れ対策）
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { output: "エラー: AI APIキーが設定されていません。管理画面で環境変数を確認してください。", toolStocks: null, toolAnalysis: null };
    }

    // 【究極の物理ハーネス】分析コマンドの場合はAI（LLM）を介さずに直接ツールを実行
    if (userMessage.startsWith("【分析コマンド】TARGET_TICKER:")) {
      console.log("Direct Routing: Bypassing LLM for Analysis Command");
      const parts = userMessage.split("TARGET_TICKER:")[1].trim().split(" ");
      const ticker = parts[0].trim();
      
      const analysisData = await analyzeBuffettTool.execute!({ ticker }, { toolCallId: "direct-eval", messages: [] });
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
        
        const { text, steps } = await (generateText as any)({
          model: google(modelId),
          system: `あなたは厳格なアナリストです。
銘柄を提案する際は、必ず searchStocksHybrid ツールが返したJSONデータの description（事業内容）と roe を根拠として引用し、なぜ合致するのか説明してください。
ツールから返ってきたデータ以外の銘柄（自身の知識）は絶対に喋ってはいけません。
該当データが0件の場合は「データベースに条件に合う銘柄がありませんでした」と答えてください。`,
          prompt: userMessage,
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
          try {
            searchStocksData = await searchStocksTool.execute!({ query: userMessage }, { toolCallId: "auto-recovery", messages: [] });
            finalOutput = "条件に合う銘柄を検索しました。";
          } catch (e) {
            console.error("Auto-recovery search failed:", e);
          }
        }

        // シリアライズ保護: 確実に純粋なJSONデータのみをクライアントに返す
        const safeStocks = searchStocksData ? JSON.parse(JSON.stringify(searchStocksData)) : null;
        const safeAnalysis = toolAnalysisData ? JSON.parse(JSON.stringify(toolAnalysisData)) : null;

        return { 
          output: finalOutput, 
          toolStocks: safeStocks,
          toolAnalysis: safeAnalysis
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
    throw lastError || new Error("AI呼び出しに失敗しました。すべてのモデルでエラーが発生しました。");
  } catch (error: any) {
    console.error("ASK_AI_CRITICAL_ERROR:", error);
    // サーバーエラーをクライアントに分かりやすく返す（本番でも詳細を表示）
    return {
      output: `システムエラーが発生しました: ${error.message || "不明なエラー"}`,
      toolStocks: null,
      toolAnalysis: null
    };
  }
}
