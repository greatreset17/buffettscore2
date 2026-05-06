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
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

async function main() {
  console.log('🚀 Gemini Embedding 2 (gemini-embedding-2) によるベクトル化を開始します...');
  const TARGET_LIMIT = 1000;
  let totalProcessed = 0;

  while (totalProcessed < TARGET_LIMIT) {
    const { count: totalRemaining } = await supabase
      .from('tickers')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);

    const batchSize = Math.min(20, TARGET_LIMIT - totalProcessed);
    const { data: tickers, error: fetchError } = await supabase
      .from('tickers')
      .select('id, symbol, name')
      .is('embedding', null)
      .limit(batchSize); // バッチを小さくしてこまめに更新

    if (fetchError) {
      console.error('❌ 取得失敗:', fetchError);
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    if (!tickers || tickers.length === 0) {
      console.log('🎉 すべての銘柄が完了しました！');
      break;
    }

    console.log(`\n--- 処理中 (残り: ${totalRemaining} 件 / 今回の目標まであと ${TARGET_LIMIT - totalProcessed} 件) ---`);

    for (const t of tickers) {
      if (totalProcessed >= TARGET_LIMIT) break;
      
      try {
        // Yahoo Finance から事業概要を取得
        const summary = await yahooFinance.quoteSummary(t.symbol, { modules: ['assetProfile'] }).catch(() => null);
        const description = summary?.assetProfile?.longBusinessSummary || t.name;

        // Gemini Embedding 2 でベクトル化 (768次元を指定)
        const result = await embedModel.embedContent({
          content: { role: "user", parts: [{ text: description }] },
          outputDimensionality: 768,
        });
        const embedding = Array.from(result.embedding.values);

        // 更新
        const { error: updateError } = await supabase
          .from('tickers')
          .update({ description, embedding })
          .eq('id', t.id);

        if (updateError) {
          process.stdout.write(`❌ ${t.symbol} `);
        } else {
          process.stdout.write(`✅ ${t.symbol} `);
          totalProcessed++;
        }
      } catch (err: any) {
        if (err.message?.includes('429') || err.message?.includes('quota')) {
          console.log(`\n🛑 API制限に達しました。1分間待機します... (${t.symbol})`);
          await new Promise(r => setTimeout(r, 60000));
          break; // 現在のバッチを抜けてリトライ
        } else {
          process.stdout.write(`⚠️ ${t.symbol}(${err.message?.substring(0, 20)}) `);
          // エラーが出ても embedding=NULL のままなので、次回またリトライされます
        }
      }
      // 無料枠(15RPM)に配慮して、約4.5秒に1件のペースで実行
      await new Promise(r => setTimeout(r, 4500));
    }
  }

  console.log(`\n\n✅ 今回の目標 1000 件の処理が完了しました！ (累計処理数: ${totalProcessed} 件)`);
}

main();
