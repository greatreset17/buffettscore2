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
  const { data, error } = await supabase.rpc('match_tickers', {
    query_embedding: new Array(768).fill(0),
    match_threshold: 0.01,
    match_count: 1
  });
  
  if (error) {
    console.log("RPC match_tickers Error:", error.message);
  } else {
    console.log("RPC match_tickers Success!");
  }

  const { data: data2, error: error2 } = await supabase.rpc('hybrid_search_stocks', {
    query_embedding: new Array(768).fill(0),
    match_threshold: 0.01,
    match_count: 1
  });

  if (error2) {
    console.log("RPC hybrid_search_stocks Error:", error2.message);
  } else {
    console.log("RPC hybrid_search_stocks Success!");
  }
}

main();
