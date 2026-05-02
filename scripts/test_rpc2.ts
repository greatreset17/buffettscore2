import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env FIRST
const envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function test() {
  const { pipeline } = await import("@xenova/transformers");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor("AI関連", { pooling: "mean", normalize: true });
  const embedding = Array.from(output.data as any);

  console.log("Calling hybrid_search_stocks...");
  const { data, error } = await supabase.rpc("hybrid_search_stocks", {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5,
    min_roe: 0.15, // 15%
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
