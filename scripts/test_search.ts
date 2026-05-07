import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function testSearch() {
  const query = "半導体";
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor(query, { pooling: "mean", normalize: true });
  const embedding = Array.from(output.data);

  const { data, error } = await supabase.rpc("hybrid_search_stocks", {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5
  });

  if (error) {
    console.error("RPC Error:", error.message);
  } else {
    console.log("Keys in result:", Object.keys(data[0] || {}));
    console.log("Full data sample:", data[0]);
  }
}

testSearch();
