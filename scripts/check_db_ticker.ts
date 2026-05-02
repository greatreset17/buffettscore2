import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ogkkuvayyyjueoarubck.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na2t1dmF5eXlqdWVvYXJ1YmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzM1NTYsImV4cCI6MjA4OTY0OTU1Nn0.yYYySPdtIYr-geuJq4FAKyoWEvcCYIgshDe55a8iKWs"
);

async function checkDb() {
  const tables = ["tickers", "stocks", "companies"];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").eq("ticker", "2038.T").limit(1);
    if (!error && data.length > 0) {
      console.log(`Found in table ${table}:`, data[0]);
      return;
    }
  }
  console.log("Not found in any common tables.");
}

checkDb();
