import { tool } from "ai";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

export const searchStocksTool = (tool as any)({
  description: "Search for stocks by keywords or semantic themes using vector search.",
  parameters: (null as any),
  execute: async (args: any) => {
    const query = typeof args === "string" ? args : args?.query || "";
    console.log(`[Tool:searchStocks] Query: "${query}"`);
    
    try {
      if (!supabase) throw new Error("Supabase is not configured");

      // 1. Google Gemini でクエリをベクトル化
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(query || "AI").catch(e => {
        console.error("Embedding API Error:", e.message);
        return null;
      });

      if (!result) {
        console.log("Embedding failed, falling back to simple keyword search.");
        const { data: kwData } = await supabase
          .from("tickers")
          .select("*")
          .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
          .limit(10);
        return kwData || [];
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
        const { data: kwData } = await supabase
          .from("tickers")
          .select("*")
          .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
          .limit(10);
        return kwData || [];
      }

      console.log(`[Tool:searchStocks] Found ${data?.length || 0} results.`);
      return data || [];
    } catch (error: any) {
      console.error("Search Tool Critical Error:", error.message);
      return [];
    }
  },
});
