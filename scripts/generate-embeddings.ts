/**
 * 堅牢なバッチベクトル化スクリプト
 * ─────────────────────────────────────────────────────────
 * 
 * 処理フロー:
 *   1. Supabase から embedding が NULL の銘柄を 100件ずつ取得
 *   2. Yahoo Finance から事業概要 (longBusinessSummary) を取得
 *   3. transformers.js でベクトル化 (all-MiniLM-L6-v2, 384次元)
 *   4. Supabase の description + embedding カラムを UPDATE
 *   5. 進行状況をローカルファイル (progress.json) に保存
 *   6. エラーが起きても次の銘柄に進み、失敗リストを記録
 *   7. 再実行時は embedding=NULL の銘柄のみを処理するため自動的に再開
 *
 * 実行:
 *   npx tsx scripts/generate-embeddings.ts
 *
 * オプション:
 *   --market JP     JP銘柄のみ処理
 *   --market US     US銘柄のみ処理
 *   --batch 50      バッチサイズを変更 (デフォルト: 100)
 *   --delay 2000    API間隔をms で指定 (デフォルト: 1500)
 *   --dry-run       実際の更新を行わず、処理対象の確認のみ
 */

import { createClient } from '@supabase/supabase-js';
import yf from 'yahoo-finance2';
import { pipeline } from '@xenova/transformers';
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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

// ─── CLI引数のパース ──────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    market: '' as string,       // 'JP' | 'US' | '' (all)
    batchSize: 100,
    delay: 1500,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--market' && args[i + 1]) { opts.market = args[++i].toUpperCase(); }
    if (args[i] === '--batch' && args[i + 1])  { opts.batchSize = parseInt(args[++i], 10); }
    if (args[i] === '--delay' && args[i + 1])  { opts.delay = parseInt(args[++i], 10); }
    if (args[i] === '--dry-run')               { opts.dryRun = true; }
  }
  return opts;
}

// ─── 進行状況ファイル ─────────────────────────────────────
const PROGRESS_FILE = resolve(__dirname, 'data', 'embedding_progress.json');

interface ProgressData {
  totalProcessed: number;
  totalSuccess: number;
  totalSkipped: number;
  totalFailed: number;
  failedSymbols: string[];
  lastRunAt: string;
}

function loadProgress(): ProgressData {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch { /* ignore */ }
  }
  return {
    totalProcessed: 0,
    totalSuccess: 0,
    totalSkipped: 0,
    totalFailed: 0,
    failedSymbols: [],
    lastRunAt: '',
  };
}

function saveProgress(p: ProgressData) {
  p.lastRunAt = new Date().toISOString();
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), 'utf-8');
}

// ─── メイン処理 ──────────────────────────────────────────
async function main() {
  const opts = parseArgs();
  const progress = loadProgress();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   BUFFETT SCORE — Embedding Batch Processor         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  設定:`);
  console.log(`    マーケット : ${opts.market || 'ALL (JP + US)'}`);
  console.log(`    バッチサイズ: ${opts.batchSize}`);
  console.log(`    API間隔    : ${opts.delay}ms`);
  console.log(`    Dry Run    : ${opts.dryRun ? 'YES (更新しません)' : 'NO'}`);
  if (progress.totalProcessed > 0) {
    console.log(`\n  前回の実行結果:`);
    console.log(`    処理済み: ${progress.totalProcessed} / 成功: ${progress.totalSuccess} / 失敗: ${progress.totalFailed}`);
    console.log(`    最終実行: ${progress.lastRunAt}`);
  }
  console.log('');

  // 1. モデルの初期化
  console.log('🤖 埋め込みモデルをロード中 (all-MiniLM-L6-v2)...');
  console.log('   ※ 初回はモデルのダウンロードに数分かかります');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extractor: any;
  try {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ モデルのロードが完了しました\n');
  } catch (err) {
    console.error('❌ モデルのロードに失敗しました:', err);
    process.exit(1);
  }

  // 2. 全体の未処理件数を取得
  let countQuery = supabase
    .from('tickers')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);
  if (opts.market) {
    countQuery = countQuery.eq('market', opts.market);
  }
  const { count: totalRemaining } = await countQuery;
  console.log(`📊 未処理の銘柄数: ${totalRemaining ?? '不明'} 件\n`);

  if (totalRemaining === 0) {
    console.log('✅ すべての銘柄が処理済みです。お疲れさまでした！');
    return;
  }

  if (opts.dryRun) {
    console.log('🔍 Dry Run モード — 処理対象の一部を表示します:');
    let previewQuery = supabase
      .from('tickers')
      .select('symbol, name, market')
      .is('embedding', null)
      .limit(10);
    if (opts.market) previewQuery = previewQuery.eq('market', opts.market);
    const { data: preview } = await previewQuery;
    preview?.forEach(t => console.log(`   • ${t.symbol} — ${t.name} (${t.market})`));
    console.log(`   ... 他 ${(totalRemaining ?? 0) - 10} 件`);
    return;
  }

  // 3. バッチループ
  let batchNum = 0;
  let processedThisRun = 0;
  let successThisRun = 0;
  let skippedThisRun = 0;
  let failedThisRun = 0;

  while (true) {
    batchNum++;

    // embedding が NULL のレコードを取得
    let query = supabase
      .from('tickers')
      .select('id, symbol, name, market')
      .is('embedding', null)
      .order('id', { ascending: true })
      .limit(opts.batchSize);
    if (opts.market) {
      query = query.eq('market', opts.market);
    }

    const { data: batch, error: fetchError } = await query;

    if (fetchError) {
      console.error(`\n❌ バッチ ${batchNum} の取得に失敗:`, fetchError.message);
      console.log('   5秒後にリトライします...');
      await sleep(5000);
      continue;
    }

    if (!batch || batch.length === 0) {
      break; // 全件処理完了
    }

    console.log(`\n━━━ バッチ ${batchNum} (${batch.length} 件) ━━━━━━━━━━━━━━━━━━━━━━━`);

    for (let i = 0; i < batch.length; i++) {
      const t = batch[i];
      processedThisRun++;

      const progressStr = `[${processedThisRun}] ${t.symbol}`;
      process.stdout.write(`  ${progressStr} ... `);

      try {
        // Yahoo Finance から事業概要を取得
        let description: string | undefined;
        try {
          const summary = await yahooFinance.quoteSummary(t.symbol, {
            modules: ['assetProfile'],
          });
          description = summary?.assetProfile?.longBusinessSummary;
        } catch (yfErr) {
          const msg = yfErr instanceof Error ? yfErr.message : 'Unknown';
          // Yahoo Finance でデータが取れない場合は銘柄名でフォールバック（最低限の検索性）
          description = t.name;
          process.stdout.write(`(YF不可: ${msg.substring(0, 30)}, 名前で代替) `);
        }

        if (!description || description.trim().length < 5) {
          // 説明文がない銘柄にもゼロベクトルを書き込み「処理済み」にする
          const zeroEmbedding = new Array(384).fill(0);
          await supabase
            .from('tickers')
            .update({ description: 'N/A', embedding: zeroEmbedding })
            .eq('id', t.id);
          console.log('⏭️  スキップ (説明文なし → 処理済みマーク)');
          skippedThisRun++;
          continue;
        }

        // ベクトル化
        const output = await extractor(description, {
          pooling: 'mean',
          normalize: true,
        });
        const embedding = Array.from(output.data) as number[];

        // Supabase を更新
        const { error: updateError } = await supabase
          .from('tickers')
          .update({ description, embedding })
          .eq('id', t.id);

        if (updateError) {
          console.log(`❌ DB更新失敗: ${updateError.message}`);
          failedThisRun++;
          progress.failedSymbols.push(t.symbol);
        } else {
          console.log(`✅ 完了 (${description.substring(0, 40)}...)`);
          successThisRun++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.log(`❌ エラー: ${message.substring(0, 60)}`);
        failedThisRun++;
        progress.failedSymbols.push(t.symbol);
      }

      // API レート制限に配慮
      await sleep(opts.delay);
    }

    // バッチ完了ごとに進行状況を保存
    progress.totalProcessed += batch.length;
    progress.totalSuccess += successThisRun;
    progress.totalSkipped += skippedThisRun;
    progress.totalFailed += failedThisRun;
    saveProgress(progress);

    // リセット（次のバッチ集計用）
    successThisRun = 0;
    skippedThisRun = 0;
    failedThisRun = 0;

    console.log(`\n  📁 進行状況を保存しました → ${PROGRESS_FILE}`);
  }

  // 4. 最終レポート
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   処理完了レポート                                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  今回の処理件数  : ${String(processedThisRun).padStart(6)} 件                       ║`);
  console.log(`║  累計 成功       : ${String(progress.totalSuccess).padStart(6)} 件                       ║`);
  console.log(`║  累計 スキップ   : ${String(progress.totalSkipped).padStart(6)} 件                       ║`);
  console.log(`║  累計 失敗       : ${String(progress.totalFailed).padStart(6)} 件                       ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (progress.failedSymbols.length > 0) {
    console.log('\n⚠️  失敗した銘柄一覧:');
    // 重複を除去して表示
    const unique = [...new Set(progress.failedSymbols)];
    unique.forEach(s => console.log(`   • ${s}`));
    console.log(`\n  → 再実行すると、embedding=NULL の銘柄のみを再処理します。`);
  }

  saveProgress(progress);
  console.log('\n🎉 お疲れさまでした！');
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── エントリーポイント ──────────────────────────────────
main().catch((err) => {
  console.error('\n💥 予期しないエラーが発生しました:', err);
  console.log('   → 再実行すると、中断した箇所から処理を再開できます。');
  process.exit(1);
});
