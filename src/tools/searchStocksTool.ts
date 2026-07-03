import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

// ベクトル検索が使えない時のフォールバック。
// クエリをスペースで単語に分割し、各単語で symbol / name / description を部分一致検索する
// (「半導体 割安 株」のような複合クエリ全体では絶対にヒットしないため)
async function keywordFallbackSearch(query: string) {
  if (!supabase) return [];
  const terms = query.split(/[\s、,]+/).filter(t => t.length >= 2);
  if (terms.length === 0) terms.push(query);

  const conditions = terms
    .flatMap(t => [`symbol.ilike.%${t}%`, `name.ilike.%${t}%`, `description.ilike.%${t}%`])
    .join(",");

  const { data, error } = await supabase
    .from("tickers")
    .select("*")
    .or(conditions)
    .limit(10);

  if (error) {
    console.error("Keyword Fallback Error:", error.message);
    return [];
  }
  console.log(`[Tool:searchStocks] Keyword fallback found ${data?.length || 0} results.`);
  return data || [];
}

export const searchStocksTool = tool({
  description: "Search for stocks by keywords or semantic themes using vector search.",
  inputSchema: z.object({
    query: z.string().describe("検索キーワードやテーマ（例: 半導体, AI関連, 再生可能エネルギー）"),
  }),
  execute: async ({ query }) => {
    console.log(`[Tool:searchStocks] Query: "${query}"`);
    
    try {
      if (!supabase) throw new Error("Supabase is not configured");

      // 1. Google Gemini でクエリをベクトル化
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text: query || "AI" }] },
        outputDimensionality: 768,
      } as any).catch(e => {
        console.error("Embedding API Error:", e.message);
        return null;
      });

      if (!result) {
        console.log("Embedding failed, falling back to simple keyword search.");
        return keywordFallbackSearch(query);
      }

      const embedding = Array.from(result.embedding.values);

      // 2. Supabase の RPC を呼び出し
      // 閾値を 0.1 から 0.01 に下げて、より広い範囲をヒットさせる
      const { data, error } = await supabase.rpc("match_tickers", {
        query_embedding: embedding,
        match_threshold: 0.01,
        match_count: 10,
      });

      if (error) {
        console.error("RPC Error:", error.message);
        // キーワード検索でフォールバック
        return keywordFallbackSearch(query);
      }

      console.log(`[Tool:searchStocks] Found ${data?.length || 0} results.`);
      return data || [];
    } catch (error: any) {
      console.error("Search Tool Critical Error:", error.message);
      return [];
    }
  },
});
