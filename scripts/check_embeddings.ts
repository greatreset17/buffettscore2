import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkEmbeddings() {
  const { data, error } = await supabase
    .from("tickers")
    .select("symbol, name, embedding")
    .limit(5);
  
  if (error) {
    console.error("Error:", error.message);
  } else {
    data.forEach((s: any) => {
      console.log(`- ${s.symbol}: ${s.name} (Embedding type: ${typeof s.embedding}, length: ${s.embedding?.length || "null"})`);
      if (s.embedding) {
          console.log(`  Sample: ${s.embedding.substring?.(0, 50) || "not a string"}`);
      }
    });
  }
}

checkEmbeddings();
