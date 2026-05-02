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
    // 引数がオブジェクトでない（単一文字列などの）場合への対応
    const query = typeof args === "string" ? args : args?.query || "";
    const roe = typeof args === "object" ? args?.roe : undefined;
    const equity_ratio = typeof args === "object" ? args?.equity_ratio : undefined;
    const sales_growth = typeof args === "object" ? args?.sales_growth : undefined;

    // AIが数値をオブジェクト（例: { min: 15 }）として出力するハルシネーションへの対策
    const parseNumber = (val: any) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === "object") {
        return val.min ?? val.value ?? val.max ?? val.target ?? undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    const parsedRoe = parseNumber(roe);
    const parsedEquity = parseNumber(equity_ratio);
    const parsedSales = parseNumber(sales_growth);

    try {
      // クエリが空の場合はエラーを避けるためのデフォルト値
      const searchTarget = query || "AI";

      // 1. クエリ文字列をベクトル化 (Embedding)
      let embedding: number[] = [];
      try {
        const extractor = await PipelineSingleton.getInstance();
        const output = await extractor(searchTarget, {
          pooling: "mean",
          normalize: true,
        });
        embedding = Array.from(output.data);
      } catch (embedError: any) {
        console.error("Embedding failed:", embedError);
        throw new Error(`ベクトル化処理に失敗しました。Vercel等の本番環境ではメモリ不足やファイルシステム制限でTransformersが動作しない場合があります。Error: ${embedError.message}`);
      }

      // 2. 数値パラメータのスケーリング処理
      const rpcArgs: any = {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 5,
      };

      if (parsedRoe !== undefined && !isNaN(parsedRoe)) rpcArgs.min_roe = parsedRoe / 100.0;
      if (parsedEquity !== undefined && !isNaN(parsedEquity)) rpcArgs.min_equity_ratio = parsedEquity / 100.0;
      if (parsedSales !== undefined && !isNaN(parsedSales)) rpcArgs.min_sales_growth = parsedSales / 100.0;

      // 3. SupabaseのRPC関数呼び出し
      if (!supabase) {
        throw new Error("Supabaseクライアントが正しく初期化されていません。NEXT_PUBLIC_SUPABASE_URL 等の環境変数が設定されているか確認してください。");
      }

      console.log("Calling Supabase RPC with args:", { ...rpcArgs, query_embedding: "TRUNCATED" });
      const { data, error } = await supabase.rpc("hybrid_search_stocks", rpcArgs);

      if (error) {
        console.error("Supabase RPC Error:", error);
        throw new Error(`データベース検索エラー: ${error.message}`);
      }

      console.log('【DB検索結果の生データ】:', JSON.stringify(data, null, 2));
      console.log(`Search success: ${data?.length || 0} stocks found`);
      return data || [];
    } catch (error: any) {
      console.error("Hybrid Search Tool Critical Error:", error);
      throw error;
    }
  },
});
