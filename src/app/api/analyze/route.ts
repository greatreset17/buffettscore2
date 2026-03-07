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

        if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Missing environment variables');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. キャッシュ確認 (30日以内)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: cachedRow, error: cacheError } = await supabase
            .from('buffett_analyses')
            .select('*')
            .eq('ticker', ticker.toUpperCase())
            .gt('created_at', thirtyDaysAgo.toISOString())
            .single();

        // 2. yahoo-finance2 でリアルタイムデータ取得 (常に取得)
        const quote = await yahooFinance.quote(ticker) as any;
        const currentPrice = quote?.regularMarketPrice || 0;
        const currentPER = quote?.trailingPE || 0;

        let finalData;

        // キャッシュ有効性チェック (新しいフォーマットのデータか確認)
        const isValidCache = cachedRow && cachedRow.analysis_result && typeof cachedRow.analysis_result.debtRatio !== 'undefined';

        if (isValidCache) {
            // キャッシュがある場合
            console.log('Using cached analysis for:', ticker);
            finalData = {
                ...cachedRow.analysis_result,
                price: currentPrice,
                lastUpdated: new Date(cachedRow.created_at).toLocaleString('ja-JP'),
            };
        } else {
            // 3. キャッシュが無いまたは古い場合、財務データ取得
            console.log('Fetching new analysis for:', ticker);
            const financials = await yahooFinance.quoteSummary(ticker, {
                modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'assetProfile']
            }) as any;

            // 必要な指標の抽出
            const roe = financials?.financialData?.returnOnEquity ? financials.financialData.returnOnEquity * 100 : 0;
            const debtToEquity = financials?.financialData?.debtToEquity || 0;
            const freeCashFlow = financials?.financialData?.freeCashflow || 0;
            const grossMargin = financials?.financialData?.grossMargins ? financials.financialData.grossMargins * 100 : 0;
            const assets = financials?.assetProfile?.longBusinessSummary || 'Non-disclosed Business Summary';

            // 4. Gemini API による定性評価（gemini-2.5-flash を使用）
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            console.log('Starting Gemini analysis for:', ticker);
            const prompt = `あなたはウォーレン・バフェットです。以下の財務データと事業内容を持つ企業について、バフェット流の投資哲学（経済的お堀、能力の輪、事業のシンプルさ、資本効率など）に照らし合わせて定性評価を行ってください。

【企業情報】
ティッカー: ${ticker}
事業概要: ${assets}

【財務指標】
- ROE: ${roe.toFixed(2)}%
- 負債比率 (D/E): ${debtToEquity.toFixed(2)}
- 粗利益率: ${grossMargin.toFixed(2)}%
- フリーキャッシュフロー: ${freeCashFlow.toLocaleString()}

【指示】
以下のJSONフォーマットで回答してください。思考過程は含めずJSONのみを出力してください。
{
  "score": (0-100の整数),
  "moat": "バフェット流の解説(100字程度)",
  "simplicity": "事業のシンプルさの解説(100字程度)",
  "summary": "投資家への一言メッセージ(120字程度)",
  "epsGrowth": "過去数年の成長性についての短いコメント"
}`;

            const resAI = await model.generateContent(prompt);
            const resText = resAI.response.text();
            // JSON部分だけを抽出
            const jsonStr = resText.match(/\{[\s\S]*\}/)?.[0] || '{}';
            const aiAnalysis = JSON.parse(jsonStr);

            // 統合データ (Frontend の AnalysisResult 型に合わせる)
            const analysisResult = {
                score: aiAnalysis.score || 0,
                moat: aiAnalysis.moat || '',
                simplicity: aiAnalysis.simplicity || '',
                roe: Math.round(roe * 10) / 10,
                debtRatio: Math.round(debtToEquity * 100) / 100,
                fcf: freeCashFlow > 0 ? "Positive" : "Negative",
                grossMargin: Math.round(grossMargin * 10) / 10,
                epsGrowth: aiAnalysis.epsGrowth || 'N/A',
                capexRatio: 15, // デフォルト値
                per: Math.round(currentPER * 10) / 10,
                summary: aiAnalysis.summary || '',
            };

            // 5. Supabase に保存
            await supabase.from('buffett_analyses').upsert({
                ticker: ticker.toUpperCase(),
                analysis_result: analysisResult,
                created_at: new Date().toISOString(),
            });

            finalData = {
                ...analysisResult,
                price: currentPrice,
                lastUpdated: new Date().toLocaleString('ja-JP'),
            };
        }

        return NextResponse.json(finalData);
    } catch (error: any) {
        console.error('API Error:', error);

        // ユーザーフレンドリーなエラーメッセージへの変換
        let errorMessage = 'エラーが発生しました。';

        if (error.message?.includes('Quote not found')) {
            const ticker = error.message.split('symbol: ')[1] || '';
            if (/^\d+$/.test(ticker)) {
                errorMessage = `銘柄「${ticker}」が見つかりません。日本株の場合は「${ticker}.T」のように入力してください。`;
            } else {
                errorMessage = `銘柄「${ticker}」が見つかりません。ティッカーシンボルが正しいか確認してください。`;
            }
        } else if (error.message?.includes('Quota exceeded')) {
            errorMessage = 'APIの利用制限を超えました。しばらく時間をおいてから再度お試しください。';
        } else {
            errorMessage = error.message || '予期せぬエラーが発生しました。';
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
