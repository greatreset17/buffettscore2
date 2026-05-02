import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor("AI", { pooling: "mean", normalize: true });
  const embedding = Array.from(output.data);

  console.log("Calling hybrid_search_stocks...");
  const { data, error } = await supabase.rpc("hybrid_search_stocks", {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5,
    min_roe: 15,
    min_equity_ratio: -999,
    min_sales_growth: -999,
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }
}

test();
