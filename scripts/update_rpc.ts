import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const sql = `
CREATE OR REPLACE FUNCTION hybrid_search_stocks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  min_roe numeric DEFAULT -999,
  min_equity_ratio numeric DEFAULT -999,
  min_sales_growth numeric DEFAULT -999
)
RETURNS TABLE (
  id bigint,
  symbol text,
  name text,
  market text,
  description text,
  roe numeric,
  equity_ratio numeric,
  sales_growth_rate numeric,
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
    tickers.description,
    tickers.roe,
    tickers.equity_ratio,
    tickers.sales_growth_rate,
    (1 - (tickers.embedding <=> query_embedding))::float AS similarity
  FROM tickers
  WHERE 
    (1 - (tickers.embedding <=> query_embedding)) > match_threshold
    AND (min_roe = -999 OR (tickers.roe IS NOT NULL AND tickers.roe >= min_roe))
    AND (min_equity_ratio = -999 OR (tickers.equity_ratio IS NOT NULL AND tickers.equity_ratio >= min_equity_ratio))
    AND (min_sales_growth = -999 OR (tickers.sales_growth_rate IS NOT NULL AND tickers.sales_growth_rate >= min_sales_growth))
  ORDER BY 
    tickers.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
`;

async function updateRpc() {
  // Unfortunately, Supabase JS client doesn't support executing arbitrary SQL easily 
  // without a special extension or RPC. 
  // Let's just create a SQL file that the user can run, or maybe use an existing RPC if available.
}
updateRpc();
