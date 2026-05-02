import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

const supabase = createClient(
  "https://ogkkuvayyyjueoarubck.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na2t1dmF5eXlqdWVvYXJ1YmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzM1NTYsImV4cCI6MjA4OTY0OTU1Nn0.yYYySPdtIYr-geuJq4FAKyoWEvcCYIgshDe55a8iKWs"
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
