import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function main() {
  const query = "銀行や金融サービス";
  console.log(`Query: ${query}`);

  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const result = await (model as any).embedContent({
    content: { role: "user", parts: [{ text: query }] },
    outputDimensionality: 768,
  });
  const embedding = Array.from(result.embedding.values);

  const { data, error } = await supabase.rpc('match_tickers', {
    query_embedding: embedding,
    match_threshold: 0.01, // 閾値を下げてみる
    match_count: 5
  });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("--- Results ---");
  data?.forEach((r: any) => {
    console.log(`${r.symbol} (${r.name}): ${r.similarity}`);
  });
}

main();
