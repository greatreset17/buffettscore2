import { readFileSync } from "fs";
import { resolve } from "path";

// Load env FIRST
const envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

async function test() {
  const { askAI } = await import("../src/app/discover/actions");

  console.log("Starting test for askAI...");
  try {
    const response = await askAI("ROEが15%以上のAI関連企業を教えて");
    console.log("askAI Response:", JSON.stringify(response, null, 2));
  } catch (e) {
    console.error("askAI Error:", e);
  }
}

test();
