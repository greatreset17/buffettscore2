import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Google Gemini の Embedding API を使用
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        const embedding = Array.from(result.embedding.values);

        return NextResponse.json({ embedding });
    } catch (error: any) {
        console.error('Vectorize Error:', error);
        return NextResponse.json(
            { error: 'Vectorization failed: ' + error.message }, 
            { status: 500 }
        );
    }
}
