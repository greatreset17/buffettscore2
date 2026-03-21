-- buffett_analyses テーブル作成
-- Supabase SQL Editor で実行してください
-- 分析結果のキャッシュと履歴保存用

CREATE TABLE IF NOT EXISTS buffett_analyses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  analysis_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_buffett_analyses_ticker ON buffett_analyses (ticker);
CREATE INDEX IF NOT EXISTS idx_buffett_analyses_created_at ON buffett_analyses (created_at DESC);

-- RLS
ALTER TABLE buffett_analyses ENABLE ROW LEVEL SECURITY;

-- 読み取り許可
CREATE POLICY "Allow public read on buffett_analyses"
  ON buffett_analyses FOR SELECT
  USING (true);

-- 書き込み許可（分析結果保存用）
CREATE POLICY "Allow public insert on buffett_analyses"
  ON buffett_analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on buffett_analyses"
  ON buffett_analyses FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 削除許可（履歴削除用）
CREATE POLICY "Allow public delete on buffett_analyses"
  ON buffett_analyses FOR DELETE
  USING (true);
