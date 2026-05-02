import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ogkkuvayyyjueoarubck.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na2t1dmF5eXlqdWVvYXJ1YmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzM1NTYsImV4cCI6MjA4OTY0OTU1Nn0.yYYySPdtIYr-geuJq4FAKyoWEvcCYIgshDe55a8iKWs"
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
