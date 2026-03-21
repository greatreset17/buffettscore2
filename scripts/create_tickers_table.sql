-- tickers テーブル作成
-- Supabase SQL Editor で実行してください

-- pg_trgm拡張（部分一致検索の高速化）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- テーブル作成
CREATE TABLE IF NOT EXISTS tickers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL,        -- 'US' or 'JP'
  exchange TEXT,               -- 'NYSE', 'NASDAQ', 'TSE' etc.
  UNIQUE (symbol, market)
);

-- 検索用インデックス
CREATE INDEX IF NOT EXISTS idx_tickers_symbol_trgm ON tickers USING GIN (symbol gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickers_name_trgm ON tickers USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickers_market ON tickers (market);

-- RLS (Row Level Security) ポリシー
ALTER TABLE tickers ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み取り許可（公開データ）
CREATE POLICY "Allow public read access on tickers"
  ON tickers FOR SELECT
  USING (true);

-- インポートスクリプト用：書き込み許可
CREATE POLICY "Allow public insert on tickers"
  ON tickers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on tickers"
  ON tickers FOR UPDATE
  USING (true)
  WITH CHECK (true);
