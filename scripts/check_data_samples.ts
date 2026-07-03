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
    .select('symbol, name')
    .is('embedding', null)
    .limit(5);
  
  const { data: doneData, error: doneError } = await supabase
    .from('tickers')
    .select('symbol, name')
    .not('embedding', 'is', null)
    .limit(10);

  console.log("--- 処理済み (10件) ---");
  console.log(doneData);
  console.log("--- 未処理 (5件) ---");
  console.log(data);
}

main();
