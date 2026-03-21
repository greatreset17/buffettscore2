import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const market = searchParams.get('market'); // 'US', 'JP', or null (all)

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    // Supabase tickers テーブルを ILIKE で部分一致検索
    let query = supabase
      .from('tickers')
      .select('symbol, name, market, exchange')
      .or(`symbol.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(10);

    // market フィルタ（タブ切り替え対応）
    if (market) {
      query = query.eq('market', market);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // 既存フロントエンドと互換性のある形式に変換
    const formattedResults = (data || []).map((row) => ({
      ticker: row.symbol,
      name: row.name,
      exch: row.exchange || row.market,
      type: row.market,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
