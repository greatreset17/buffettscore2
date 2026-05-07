import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
