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
  const dummy3072 = new Array(3072).fill(0);
  const { error: error3072 } = await supabase.from('tickers').update({ embedding: dummy3072 }).eq('id', -1);
  console.log("3072 Update Error:", error3072?.message);

  const dummy768 = new Array(768).fill(0);
  const { error: error768 } = await supabase.from('tickers').update({ embedding: dummy768 }).eq('id', -1);
  console.log("768 Update Error:", error768?.message);
}

main();
