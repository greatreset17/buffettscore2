-- 1. pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. tickers テーブルに説明文とベクトルカラムを追加
-- dimension は 384 (all-MiniLM-L6-v2 モデルに対応)
ALTER TABLE tickers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tickers ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. 類似度検索関数を作成
-- query_embedding とのコサイン類似度でソートして返す
CREATE OR REPLACE FUNCTION match_tickers (
  query_embedding vector(384),
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
    AND 1 - (tickers.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. インデックスの作成（検索の高速化）
-- 銘柄数が多い場合に HNSW インデックスが有効
-- ※ 既にデータが入っている場合に実行することを推奨
-- CREATE INDEX ON tickers USING hnsw (embedding vector_cosine_ops);
