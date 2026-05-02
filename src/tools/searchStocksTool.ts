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
    
    try {
      if (!supabase) throw new Error("Supabase is not configured");

      // 1. Google Gemini でクエリをベクトル化 (768次元)
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(query || "AI");
      const embedding = Array.from(result.embedding.values);

      // 2. Supabase の RPC (match_tickers) を呼び出し
      // 注意: DB側の次元数を 768 に更新する必要があります
      const { data, error } = await supabase.rpc("match_tickers", {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
      });

      if (error) {
        console.error("RPC Error, falling back to keyword search:", error);
        // ベクトルの次元不一致等の場合はキーワード検索でフォールバック
        const { data: kwData, error: kwError } = await supabase
          .from("tickers")
          .select("*")
          .or(`symbol.ilike.%${query}%,name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10);
        
        if (kwError) throw kwError;
        return kwData || [];
      }

      return data || [];
    } catch (error: any) {
      console.error("Search Tool Error:", error);
      return [];
    }
  },
});
