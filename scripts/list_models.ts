import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || "";
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.models.forEach((m: any) => {
      console.log(`- ${m.name} (${m.displayName})`);
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
