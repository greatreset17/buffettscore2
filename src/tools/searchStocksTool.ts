import { tool } from "ai";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const searchStocksTool = (tool as any)({
  description: "Search for stocks by keywords or filters.",
  parameters: (null as any), // 簡易化
  execute: async (args: any) => {
    const query = typeof args === "string" ? args : args?.query || "";
    try {
      if (!supabase) throw new Error("Supabase is not configured");
      
      // キーワードのみの単純検索（ベクトルを使わない）
      const { data, error } = await supabase
        .from("stocks")
        .select("*")
        .or(`ticker.ilike.%${query}%,name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Search Error:", error);
      return [];
    }
  },
});
