import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('tickers')
    .select('symbol, embedding')
    .not('embedding', 'is', null)
    .limit(1);

  if (data && data[0] && data[0].embedding) {
    const embedding = typeof data[0].embedding === 'string' ? JSON.parse(data[0].embedding) : data[0].embedding;
    console.log(`Symbol: ${data[0].symbol}`);
    console.log(`Embedding dimensions: ${embedding.length}`);
  } else {
    console.log("No embeddings found or error:", error);
  }
}

main();
