import { createClient } from '@supabase/supabase-js';
import yf from 'yahoo-finance2';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ─── 環境変数の読み込み ───────────────────────────────────
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
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !GEMINI_API_KEY) {
  console.error('❌ 環境変数が足りません (.env.local を確認してください)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// yahoo-finance2 v3 対応の初期化
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

async function main() {
  console.log('🚀 Gemini (text-embedding-004) による再ベクトル化を開始します...');

  // 1. embedding が NULL の銘柄を取得
  const { data: tickers, error: fetchError } = await supabase
    .from('tickers')
    .select('id, symbol, name')
    .is('embedding', null)
    .limit(100);

  if (fetchError) {
    console.error('❌ 取得失敗:', fetchError);
    return;
  }

  if (!tickers || tickers.length === 0) {
    console.log('✅ すべての銘柄が処理済みです。');
    return;
  }

  for (const t of tickers) {
    process.stdout.write(`  ${t.symbol} ... `);
    try {
      // Yahoo Finance から事業概要を取得
      const summary = await yahooFinance.quoteSummary(t.symbol, { modules: ['assetProfile'] }).catch(() => null);
      const description = summary?.assetProfile?.longBusinessSummary || t.name;

      // Gemini でベクトル化 (768次元)
      const result = await embedModel.embedContent(description);
      const embedding = Array.from(result.embedding.values);

      // 更新
      const { error: updateError } = await supabase
        .from('tickers')
        .update({ description, embedding })
        .eq('id', t.id);

      if (updateError) {
        console.log(`❌ DB更新失敗: ${updateError.message}`);
      } else {
        console.log(`✅ 完了 (768 dim)`);
      }
    } catch (err: any) {
      console.log(`❌ エラー: ${err.message}`);
    }
    // レート制限回避
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n✨ バッチ処理が完了しました。続けて実行するには再度コマンドを叩いてください。');
}

main();
