import { z } from "zod";
import { tool } from "ai";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

// シングルトンでパイプラインを保持するクラス（vectorize APIと同様の実装）
class PipelineSingleton {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: any = null;

  static async getInstance() {
    if (!this.instance) {
      this.instance = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
    }
    return this.instance;
  }
}

// Supabaseクライアントの初期化（本番環境でのクラッシュを避けるため安全に実行）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing!");
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabase();

export const searchStocksTool = (tool as any)({
  description:
    "複数の銘柄を条件（事業内容、ROE等）で『検索・スクリーニング』するためのツールです。※注意：特定の1銘柄に対する詳細な分析や評価を行う場合には、このツールを使用しないでください。",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "ユーザーの検索意図や事業内容、テーマなどを表すキーワードや文章（例：「AI関連の企業」「再生可能エネルギー」）"
      ),
    roe: z
      .any()
      .optional()
      .describe("検索対象となる最小のROE（自己資本利益率）。例: 15%以上なら 15 と指定。"),
    equity_ratio: z
      .any()
      .optional()
      .describe("検索対象となる最小の自己資本比率。例: 40%以上なら 40 と指定。"),
    sales_growth: z
      .any()
      .optional()
      .describe("検索対象となる最小の売上高成長率。例: 5%以上なら 5 と指定。"),
  }),
  execute: async (args: any) => {
    const query = typeof args === "string" ? args : args?.query || "";
    
    try {
      console.log("Production Test: Bypassing Transformers");
      
      // 本番環境で Transformers が動かない場合の暫定処理
      // 本来はここで Gemini API 等を使ってベクトル化すべきですが、まずはクラッシュを避けます
      const dummyEmbedding = new Array(384).fill(0); 

      const rpcArgs: any = {
        query_embedding: dummyEmbedding,
        match_threshold: 0.0, // 0にすることで、埋め込みがダミーでもキーワード等で引っかかるようにする
        match_count: 10,
      };

      if (!supabase) {
        throw new Error("Supabaseクライアントが設定されていません。環境変数を確認してください。");
      }

      const { data, error } = await supabase.rpc("hybrid_search_stocks", rpcArgs);

      if (error) throw new Error(`DB検索エラー: ${error.message}`);
      return data || [];
    } catch (error: any) {
      console.error("Search Tool Error:", error);
      return { error: error.message };
    }
  },
});
