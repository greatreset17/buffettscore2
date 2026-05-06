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
  const { count: total, error: error1 } = await supabase
    .from('tickers')
    .select('*', { count: 'exact', head: true });

  const { count: done, error: error2 } = await supabase
    .from('tickers')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  const { count: remaining, error: error3 } = await supabase
    .from('tickers')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null);

  console.log(`Total: ${total}`);
  console.log(`Done: ${done}`);
  console.log(`Remaining: ${remaining}`);
}

main();
