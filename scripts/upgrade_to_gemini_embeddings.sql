-- 1. 既存の embedding カラムの型を変更 (384 -> 768)
-- ※ 既存のデータは一旦クリアされます（再ベクトル化が必要です）
ALTER TABLE tickers ALTER COLUMN embedding TYPE vector(768);

-- 2. 検索関数 (match_tickers) を 768次元対応に更新
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
  WHERE tickers.description IS DISTINCT FROM 'N/A'
    AND tickers.embedding IS NOT NULL
    AND 1 - (tickers.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 3. ハイブリッド検索関数 (hybrid_search_stocks) も 768次元対応に更新
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
  WHERE (1 - (t.embedding <=> query_embedding) > match_threshold)
    AND (t.roe >= min_roe OR min_roe = -999)
    AND (t.equity_ratio >= min_equity_ratio OR min_equity_ratio = -999)
    AND (t.sales_growth >= min_sales_growth OR min_sales_growth = -999)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
