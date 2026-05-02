import { createClient } from '@supabase/supabase-js';
import yf from 'yahoo-finance2';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';
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
  console.error('❌ 環境変数が足りません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

async function main() {
  console.log('🚀 Gemini (gemini-embedding-001) による全件自動ベクトル化を開始します...');

  let totalProcessed = 0;

  while (true) {
    // 全体の残り件数を取得
    const { count: totalRemaining } = await supabase
      .from('tickers')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);

    // 今回処理するバッチを取得
    const { data: tickers, error: fetchError } = await supabase
      .from('tickers')
      .select('id, symbol, name')
      .is('embedding', null)
      .limit(50);

    if (fetchError) {
      console.error('❌ 取得失敗リトライ中...', fetchError);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    if (!tickers || tickers.length === 0) {
      console.log('🎉 すべての銘柄が完了しました！');
      break;
    }

    console.log(`\n--- バッチ処理中 (全体残り: ${totalRemaining} 件 / 累計 ${totalProcessed} 件完了) ---`);

    for (const t of tickers) {
      try {
        // Yahoo Finance から事業概要を取得
        const summary = await yahooFinance.quoteSummary(t.symbol, { modules: ['assetProfile'] }).catch(() => null);
        const description = summary?.assetProfile?.longBusinessSummary || t.name;

        // Gemini でベクトル化
        const result = await embedModel.embedContent(description);
        const embedding = Array.from(result.embedding.values);

        // 更新
        const { error: updateError } = await supabase
          .from('tickers')
          .update({ description, embedding })
          .eq('id', t.id);

        if (updateError) {
          process.stdout.write(`❌ ${t.symbol} `);
        } else {
          process.stdout.write(`✅ ${t.symbol}(${embedding.length}d) `);
          totalProcessed++;
        }
      } catch (err: any) {
        process.stdout.write(`⚠️ ${t.symbol} `);
      }
      // APIレート制限に配慮 (1秒に1件)
      await new Promise(r => setTimeout(r, 800));
    }
  }
}

main();
