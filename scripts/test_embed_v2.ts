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

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

async function main() {
  try {
    const result = await embedModel.embedContent({
      content: { role: "user", parts: [{ text: "Hello world" }] },
      outputDimensionality: 768,
    });
    console.log("Success! Dims:", result.embedding.values.length);
  } catch (err: any) {
    console.error("Full Error:", err);
  }
}

main();
