/**
 * 日本株インポートスクリプト
 * JPX（日本取引所グループ）の上場銘柄一覧CSVから
 * Supabase の tickers テーブルに一括インポートする。
 *
 * 事前準備:
 *   1. https://www.jpx.co.jp/markets/statistics-equities/misc/01.html から
 *      Excelファイルをダウンロード
 *   2. CSV形式で保存 → scripts/data/jpx_listed.csv に配置
 *
 * CSVフォーマット（JPX標準）:
 *   日付, コード, 銘柄名, 市場・商品区分, 33業種コード, 33業種区分, ...
 *
 * 実行: npx tsx scripts/import-jp-tickers.ts
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
const CSV_PATH = resolve(__dirname, 'data', 'jpx_listed.csv');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 市場区分 → 取引所名マッピング
function mapExchange(marketSection: string): string {
  if (marketSection.includes('プライム')) return 'TSE Prime';
  if (marketSection.includes('スタンダード')) return 'TSE Standard';
  if (marketSection.includes('グロース')) return 'TSE Growth';
  if (marketSection.includes('PRO')) return 'TSE PRO Market';
  if (marketSection.includes('JASDAQ')) return 'JASDAQ';
  return 'TSE';
}

async function main() {
  console.log('📂 JPX CSVファイルを読み込み中...');
  console.log(`   パス: ${CSV_PATH}`);

  let csvContent: string;
  try {
    csvContent = readFileSync(CSV_PATH, 'utf-8');
  } catch {
    console.error('❌ CSVファイルが見つかりません。');
    console.error('   以下の手順でJPXの上場銘柄一覧を配置してください:');
    console.error('   1. https://www.jpx.co.jp/markets/statistics-equities/misc/01.html');
    console.error('   2. Excelファイルをダウンロード');
    console.error('   3. CSV形式で保存 → scripts/data/jpx_listed.csv');
    process.exit(1);
  }

  const lines = csvContent.split('\n').filter((line) => line.trim());

  // ヘッダー行をスキップ（1行目はヘッダー）
  const dataLines = lines.slice(1);
  console.log(`✅ ${dataLines.length} 件のデータ行を検出`);

  const rows: { symbol: string; name: string; market: string; exchange: string }[] = [];

  for (const line of dataLines) {
    // CSV パース（ダブルクォート対応）
    const cols = parseCSVLine(line);
    if (cols.length < 4) continue;

    const code = cols[1]?.trim();    // 銘柄コード
    const name = cols[2]?.trim();    // 銘柄名
    const marketSection = cols[3]?.trim(); // 市場・商品区分

    if (!code || !name) continue;

    // ETF・REIT等も含めて全て取り込む
    rows.push({
      symbol: `${code}.T`,  // 東証コード形式
      name,
      market: 'JP',
      exchange: mapExchange(marketSection),
    });
  }

  // 重複除去
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

  console.log(`\n🎉 完了！ ${inserted} 件の日本株をインポートしました`);
}

/** シンプルなCSV行パーサー（ダブルクォート対応） */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
