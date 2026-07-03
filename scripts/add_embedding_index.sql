-- ベクトル検索のタイムアウト対策
-- match_tickers RPC が "canceling statement due to statement timeout" で
-- 失敗することがあるため、embedding カラムに HNSW インデックスを追加します。
-- Supabase ダッシュボードの SQL Editor で実行してください。

-- 1. HNSW インデックスの作成
-- RPC は <=> (コサイン距離) を使っているため、演算子クラスは vector_cosine_ops
CREATE INDEX IF NOT EXISTS tickers_embedding_hnsw_idx
  ON tickers
  USING hnsw (embedding vector_cosine_ops);

-- 2. インデックスが使われるよう ORDER BY を距離の昇順に書き換え
-- (「1 - 距離 の降順」だとプランナーがインデックスを使えないため)
CREATE OR REPLACE FUNCTION match_tickers (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  symbol text,
  name text,
  market text,
  exchange text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tickers.id,
    tickers.symbol,
    tickers.name,
    tickers.market,
    tickers.exchange,
    tickers.description,
    1 - (tickers.embedding <=> query_embedding) AS similarity
  FROM tickers
  WHERE tickers.embedding IS NOT NULL
    AND 1 - (tickers.embedding <=> query_embedding) > match_threshold
  ORDER BY tickers.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 3. hybrid_search_stocks も同様に書き換え
CREATE OR REPLACE FUNCTION hybrid_search_stocks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  min_roe float DEFAULT -999,
  min_equity_ratio float DEFAULT -999,
  min_sales_growth float DEFAULT -999
)
RETURNS TABLE (
  id bigint,
  symbol text,
  name text,
  market text,
  description text,
  roe float,
  equity_ratio float,
  sales_growth float,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.symbol,
    t.name,
    t.market,
    t.description,
    t.roe,
    t.equity_ratio,
    t.sales_growth,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM tickers t
  WHERE (t.embedding IS NOT NULL)
    AND (1 - (t.embedding <=> query_embedding) > match_threshold)
    AND (t.roe >= min_roe OR min_roe = -999)
    AND (t.equity_ratio >= min_equity_ratio OR min_equity_ratio = -999)
    AND (t.sales_growth >= min_sales_growth OR min_sales_growth = -999)
  ORDER BY t.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
