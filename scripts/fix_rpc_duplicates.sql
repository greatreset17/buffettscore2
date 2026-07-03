-- 重複している関数を一度削除して、きれいに再定義します

-- 1. 古い関数の削除 (引数の型が異なる可能性があるため、型指定なしで削除を試みます)
-- 注意: 引数が異なる複数の同名関数がある場合、型を明示する必要があります。

-- 以前作成した可能性のあるすべてのパターンを削除
DROP FUNCTION IF EXISTS match_tickers(vector, float, int);
DROP FUNCTION IF EXISTS match_tickers(vector(384), float, int);
DROP FUNCTION IF EXISTS match_tickers(vector(3072), float, int);
DROP FUNCTION IF EXISTS match_tickers(vector(768), float, int);

DROP FUNCTION IF EXISTS hybrid_search_stocks(vector, float, int, float, float, float);
DROP FUNCTION IF EXISTS hybrid_search_stocks(vector(384), float, int, float, float, float);
DROP FUNCTION IF EXISTS hybrid_search_stocks(vector(3072), float, int, float, float, float);
DROP FUNCTION IF EXISTS hybrid_search_stocks(vector(768), float, int, float, float, float);

-- 2. 768次元対応で再定義 (match_tickers)
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
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 3. 768次元対応で再定義 (hybrid_search_stocks)
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
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
