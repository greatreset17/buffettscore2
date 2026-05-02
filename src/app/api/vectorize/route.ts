import { NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';

/**
 * transformers.js のパイプラインを保持するシングルトン
 * サーバーレス環境（特に Cold Start 時）では再利用される可能性がある。
 */
class PipelineSingleton {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static instance: any = null;

    static async getInstance() {
        if (!this.instance) {
            // all-MiniLM-L6-v2 は 384次元の軽量モデル
            this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return this.instance;
    }
}

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const extractor = await PipelineSingleton.getInstance();
        
        // テキストを埋め込みベクトルに変換
        const output = await extractor(text, { 
            pooling: 'mean', 
            normalize: true 
        });

        // Float32Array を通常の配列に変換
        const embedding = Array.from(output.data);

        return NextResponse.json({ embedding });
    } catch (error) {
        console.error('Vectorize Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Vectorization failed: ' + errorMessage }, 
            { status: 500 }
        );
    }
}
