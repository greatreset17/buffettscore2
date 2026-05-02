"use server";

// すべての外部インポートを一時停止（デバッグ用）
// import { generateText } from "ai";

export async function askAI(userMessage: string) {
  try {
    return {
      output: `【デバッグモード】「${userMessage}」を受信しました。サーバーとの疎通は正常です。`,
      toolStocks: null,
      toolAnalysis: null
    };
  } catch (error: any) {
    return {
      output: `エラー: ${error.message}`,
      toolStocks: null,
      toolAnalysis: null
    };
  }
}
