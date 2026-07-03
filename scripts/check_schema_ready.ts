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
  const { data, error } = await supabase.rpc('get_column_info', { table_name: 'tickers', column_name: 'embedding' });
  // If get_column_info doesn't exist, we'll try a raw query if possible or just assume from error
  console.log("Data:", data);
  console.log("Error:", error);
  
  // Alternative: try to insert a dummy 768 vector and see if it fails
  const dummy = new Array(768).fill(0);
  const { error: testError } = await supabase.from('tickers').update({ embedding: dummy }).eq('id', -1); // use non-existent ID
  console.log("Test Update Error:", testError);
}

main();
