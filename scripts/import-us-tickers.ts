/**
 * 米国株インポートスクリプト
 * SEC EDGAR の company_tickers_exchange.json から米国上場銘柄を
 * Supabase の tickers テーブルに一括インポートする。
 *
 * 実行: npx tsx scripts/import-us-tickers.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local を読み込み
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch { /* ignore */ }

// --- 設定 ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SEC_EDGAR_URL = 'https://www.sec.gov/files/company_tickers_exchange.json';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SEC EDGAR JSON 形式: { fields: [...], data: [[cik, name, ticker, exchange], ...] }
interface SECEdgarResponse {
  fields: string[];
  data: (string | number)[][];
}

async function main() {
  console.log('📥 SEC EDGAR から米国株データを取得中...');

  const res = await fetch(SEC_EDGAR_URL, {
    headers: {
      'User-Agent': 'BuffettScore/1.0 (contact@example.com)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`SEC EDGAR fetch failed: ${res.status} ${res.statusText}`);
  }

  const json: SECEdgarResponse = await res.json();
  console.log(`✅ ${json.data.length} 件の銘柄データを取得`);

  // fields: ["cik", "name", "ticker", "exchange"]
  const rows = json.data.map((row) => ({
    symbol: String(row[2]).toUpperCase(),
    name: String(row[1]),
    market: 'US',
    exchange: String(row[3]) || null,
  }));

  // 重複除去（symbol が重複する場合は最初のものを採用）
  const seen = new Set<string>();
  const uniqueRows = rows.filter((r) => {
    if (seen.has(r.symbol)) return false;
    seen.add(r.symbol);
    return true;
  });

  console.log(`📊 ユニーク銘柄数: ${uniqueRows.length}`);

  // バッチ upsert（500件ずつ）
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const batch = uniqueRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('tickers')
      .upsert(batch, { onConflict: 'symbol,market' });

    if (error) {
      console.error(`❌ バッチ ${i / BATCH_SIZE + 1} でエラー:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r⏳ ${inserted} / ${uniqueRows.length} 件インポート済み`);
    }
  }

  console.log(`\n🎉 完了！ ${inserted} 件の米国株をインポートしました`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
