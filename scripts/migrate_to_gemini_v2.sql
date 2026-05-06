-- Gemini Embedding 2 (text-embedding-004) への移行用スクリプト (修正版: 768次元)
-- HNSWインデックスの制限 (2000次元) を回避するため、標準的な 768次元を採用します。

-- 1. 既存のベクトルカラムを削除して再作成 (3072 -> 768)
ALTER TABLE tickers DROP COLUMN IF EXISTS embedding;
ALTER TABLE tickers ADD COLUMN embedding vector(768);

-- 2. 既存のインデックスを削除
DROP INDEX IF EXISTS tickers_embedding_idx;

-- 3. HNSWインデックスの作成 (768次元)
CREATE INDEX tickers_embedding_idx ON tickers 
USING hnsw (embedding vector_cosine_ops);

-- 4. RPC関数 (match_tickers) の再定義 (768次元対応)
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

-- 5. ハイブリッド検索関数 (hybrid_search_stocks) も 768次元対応に更新
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
