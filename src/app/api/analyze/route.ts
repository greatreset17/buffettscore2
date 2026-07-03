import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// yahoo-finance2 の初期化 (ESM/CJSの差異を吸収)
// デフォルトエクスポートがクラスの場合は new し、インスタンスの場合はそのまま使う
const yahooFinance = typeof yf === 'function' ? new (yf as any)() : yf;

// 環境変数の取得
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase クライアントの初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Gemini API の初期化
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: Request) {
    try {
        const { ticker } = await request.json();

        if (!ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        // Get API Key from request header if available (for user-provided keys)
        const authHeader = request.headers.get('Authorization');
        const userApiKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        const activeApiKey = userApiKey || GEMINI_API_KEY;

        if (!activeApiKey || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Missing configuration');
            return NextResponse.json({ error: 'Server or API configuration error' }, { status: 500 });
        }

        // 1. Cache Check (30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: cachedRow } = await supabase
            .from('buffett_analyses')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .gt('created_at', thirtyDaysAgo.toISOString())
            .single();

        // 2. Fetch Real-time Data
        const quote = await yahooFinance.quote(ticker) as any;
        const currentPrice = quote?.regularMarketPrice || 0;

        if (cachedRow && cachedRow.analysis_result) {
            console.log('Using cached analysis for:', ticker);
            return NextResponse.json({
                ...cachedRow.analysis_result,
                price: currentPrice,
                lastUpdated: new Date(cachedRow.created_at).toLocaleString('ja-JP'),
            });
        }

        // 3. Fetch Financials for new analysis
        console.log('Fetching new analysis for:', ticker);
        const financials = await yahooFinance.quoteSummary(ticker, {
            modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'assetProfile']
        }) as any;

        const roe = financials?.financialData?.returnOnEquity ? financials.financialData.returnOnEquity * 100 : 0;
        const debtToEquity = financials?.financialData?.debtToEquity || 0;
        const grossMargin = financials?.financialData?.grossMargins ? financials.financialData.grossMargins * 100 : 0;
        const currentPER = quote?.trailingPE || financials?.summaryDetail?.trailingPE || 0;
        const businessSummary = financials?.assetProfile?.longBusinessSummary || 'Business summary not available.';

        // 4. Gemini Analysis (フォールバックチェーン付き)
        const genAIUser = new GoogleGenerativeAI(activeApiKey);

        // モデルの優先順位: レート制限時に次のモデルへ自動切り替え
        const MODEL_CHAIN = [
            'gemini-3.1-flash-lite',
            'gemma-4-31b-it',
            'gemma-4-26b-it',
        ];
        
        const prompt = `現在は2026年3月です。あなたはウォーレン・バフェットです。以下のデータを持つ企業をあなたの投資哲学で分析してください。
【企業】${ticker} - ${businessSummary.substring(0, 500)}...
【指標】ROE: ${roe.toFixed(2)}%, D/E: ${debtToEquity.toFixed(2)}, 粗利: ${grossMargin.toFixed(2)}%, PER: ${currentPER.toFixed(2)}

以下のJSONフォーマットのみで回答してください：
{
  "score": (0-100),
  "summary": "一言要約(100字)",
  "metrics": [
    {"label": "ROE", "value": "${roe.toFixed(1)}%", "grade": "S/A/B/C", "status": "一言評価", "description": "解説"},
    {"label": "営業利益率", "value": "${grossMargin.toFixed(1)}%", "grade": "S/A/B/C", "status": "一言評価", "description": "解説"},
    {"label": "PER", "value": "${currentPER.toFixed(1)}x", "grade": "S/A/B/C", "status": "一言評価", "description": "解説"},
    {"label": "自己資本比率", "value": "${(100/debtToEquity).toFixed(1)}%", "grade": "S/A/B/C", "status": "一言評価", "description": "解説"},
    {"label": "PBR", "value": "推定値", "grade": "S/A/B/C", "status": "一言評価", "description": "解説"},
    {"label": "配当利回り", "value": "推定値", "grade": "S/A/B/C", "status": "一言評価", "description": "解説"}
  ],
  "qualitative": [
    {"label": "ブランド・モート", "subLabel": "優位性の源泉", "status": "強力/標準/脆弱", "description": "200字程度の解説"},
    {"label": "経営陣の質", "subLabel": "資本配分の効率", "status": "卓越/良好/懸念", "description": "200字程度の解説"}
  ],
  "thesis": [
    {"title": "競争優位性", "content": "詳細解説"},
    {"title": "リスク要因", "content": "詳細解説"}
  ]
}`;

        // フォールバック付きでモデルを順番に試行
        let resText = '';
        let usedModel = '';
        for (let i = 0; i < MODEL_CHAIN.length; i++) {
            const modelName = MODEL_CHAIN[i];
            try {
                console.log(`🤖 モデル試行: ${modelName} (${i + 1}/${MODEL_CHAIN.length})`);
                const model = genAIUser.getGenerativeModel({ model: modelName });
                const resAI = await model.generateContent(prompt);
                resText = resAI.response.text();
                usedModel = modelName;
                console.log(`✅ ${modelName} で応答成功`);
                break; // 成功したらループを抜ける
            } catch (modelError: any) {
                const status = modelError?.status || modelError?.httpStatusCode || 0;
                const message = modelError?.message || '';
                const isRateLimit = status === 429 
                    || message.includes('RESOURCE_EXHAUSTED')
                    || message.includes('rate limit')
                    || message.includes('quota');

                if (isRateLimit && i < MODEL_CHAIN.length - 1) {
                    console.warn(`⚠️ ${modelName} レート制限 → 次のモデルへフォールバック`);
                    continue; // 次のモデルを試す
                }
                // 最後のモデルでも失敗、またはレート制限以外のエラー
                throw modelError;
            }
        }

        const jsonStr = resText.match(/\{[\s\S]*\}/)?.[0] || '{}';
        const aiAnalysis = JSON.parse(jsonStr);


        const finalResult = {
            ticker: ticker.toUpperCase(),
            name: quote?.longName || ticker.toUpperCase(),
            score: aiAnalysis.score || 70,
            summary: aiAnalysis.summary || '',
            metrics: aiAnalysis.metrics || [],
            qualitative: aiAnalysis.qualitative || [],
            thesis: aiAnalysis.thesis || [],
        };

        // 5. Store in Supabase
        await supabase.from('buffett_analyses').upsert({
            ticker: ticker.toUpperCase(),
            analysis_result: finalResult,
            created_at: new Date().toISOString(),
        }, { onConflict: 'ticker' });

        return NextResponse.json({
            ...finalResult,
            price: currentPrice,
            model: usedModel,
            lastUpdated: new Date().toLocaleString('ja-JP'),
        });

    } catch (error: any) {
        console.error('API Error:', error);
        // Return a more descriptive error if it's from Gemini
        const status = error.status || 500;
        const message = error.message || 'Analysis failed (Internal Server Error)';
        return NextResponse.json({ error: message }, { status });
    }
}
