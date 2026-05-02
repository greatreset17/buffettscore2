import { readFileSync } from "fs";
import { resolve } from "path";

// Load env FIRST
const envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

async function test() {
  const { generateText } = await import("ai");
  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  const { searchStocksTool } = await import("../src/tools/searchStocksTool");

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  console.log("Starting test...");
  try {
    const { text, steps } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `あなたはバフェットです。銘柄相談に乗ります。
銘柄カードを出したい時は search("キーワード")、分析時は analyze("銘柄") と含めてください。
また、定量的な条件を伴う高度な検索が必要な場合は、検索ツールを呼び出して情報を取得してください。`,
      prompt: "ROEが15%以上のAI関連企業を教えて",
      tools: {
        searchStocks: searchStocksTool,
      },
      maxSteps: 3,
    });

    console.log("TEXT RESPONSE:");
    console.log(text);
    console.log("\nSTEPS:");
    console.log(JSON.stringify(steps, null, 2));

  } catch (e) {
    console.error("Error:", e);
  }
}

test();
