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

async function listAllModels() {
  // 注意: 一部の SDK バージョンでは fetch を直接使う必要があります
  try {
    console.log("Fetching available models from API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.models) {
      console.log("\n--- Available Models ---");
      data.models.forEach((m: any) => {
        const methods = m.supportedGenerationMethods.join(", ");
        console.log(`Model: ${m.name} (${m.displayName})`);
        console.log(`Methods: ${methods}\n`);
      });
    } else {
      console.log("No models found or error in response:", data);
    }
  } catch (err: any) {
    console.error("Error fetching models:", err.message);
  }
}

listAllModels();
