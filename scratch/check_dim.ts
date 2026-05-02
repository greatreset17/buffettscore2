import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local を読み込む
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkDim() {
  const { data, error } = await supabase
    .from('tickers')
    .select('symbol, embedding')
    .not('embedding', 'is', null)
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (data && data[0] && data[0].embedding) {
    const embedding = typeof data[0].embedding === 'string' 
      ? JSON.parse(data[0].embedding) 
      : data[0].embedding;
    console.log(`Symbol: ${data[0].symbol}`);
    console.log(`Embedding Dimension: ${embedding.length}`);
  } else {
    console.log("No embedded data found.");
  }
}

checkDim();
