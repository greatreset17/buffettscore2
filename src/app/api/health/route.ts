import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2'; // Yahoo Financeのライブラリ
import { generateText } from 'ai'; // Vercel AI SDK
import { google } from '@ai-sdk/google';

// 環境変数の取得
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// yahoo-finance2 の初期化 (ESM/CJSの差異を吸収)
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

export async function GET() {
  try {
    // ---------------------------------------------------------
    // 1. Supabaseのチェック（兼・休止防止のダミーアクセス）
    // ---------------------------------------------------------
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration is missing');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: dbError } = await supabase
      .from('tickers')
      .select('id')
      .limit(1)
      .single();

    // エラーが 406 (Not Acceptable) や特定の非致命的エラーなら許容する場合もありますが、
    // ここでは厳密にチェックします。
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 は 0 件ヒットの場合
      throw new Error(`Supabase Error: ${dbError.message}`);
    }

    // ---------------------------------------------------------
    // 2. Yahoo Finance APIのチェック
    // ---------------------------------------------------------
    // エラーが起きないか確認するため、代表的な銘柄(AAPL)を1つだけ取得
    try {
      await yahooFinance.quote('AAPL');
    } catch (yfError) {
      throw new Error(`Yahoo Finance Error: ${yfError instanceof Error ? yfError.message : 'Unknown'}`);
    }

    // ---------------------------------------------------------
    // 3. Gemini APIのチェック
    // ---------------------------------------------------------
    // 軽量で高速なFlashモデルを使い、接続とAPIキーが有効かテスト
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is missing');
    }

    try {
      await generateText({
        model: google('gemini-3.1-flash-lite'),
        prompt: '接続テストです。「OK」とだけ返答してください。',
      });
    } catch (aiError) {
      throw new Error(`Gemini Error: ${aiError instanceof Error ? aiError.message : 'Unknown'}`);
    }

    // ---------------------------------------------------------
    // 全て成功した場合のレスポンス
    // ---------------------------------------------------------
    return NextResponse.json({
      status: 'healthy',
      database: 'ok',
      yahooFinance: 'ok',
      gemini: 'ok',
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    // ---------------------------------------------------------
    // どれか1つでも失敗した場合のレスポンス（ステータス500）
    // ---------------------------------------------------------
    console.error('Health Check Failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
