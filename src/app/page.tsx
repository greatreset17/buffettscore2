"use client";

import { useState, useEffect } from "react";

// --- Types ---
type AnalysisResult = {
  score: number;
  moat: string;
  simplicity: string;
  roe: number;
  debtRatio: number;
  fcf: string;
  grossMargin: number;
  epsGrowth: string;
  capexRatio: number;
  per: number;
  summary: string;
  lastUpdated: string; // 追加
};

// --- Mock AI Simulator ---
const analyzeCompanyMock = (query: string, displayName: string, forceRefresh = false): AnalysisResult => {
  // 文字列から簡単なハッシュを生成
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // forceRefresh時は現在時刻の秒数などを混ぜて、結果をわずかに変動させる
  const volatility = forceRefresh ? (new Date().getSeconds() % 5) - 2 : 0;

  const score = Math.min(100, Math.max(0, (seed % 41) + 60 + volatility));
  const roe = (seed % 25) + 8 + (volatility * 0.2);
  const debtRatio = Math.max(0, ((seed % 100) / 100) * 1.5 + (volatility * 0.01));
  const grossMargin = (seed % 45) + 20 + volatility;
  const capexRatio = Math.max(0, (seed % 60) + 5 - volatility);
  const per = Math.max(1, (seed % 40) + 5 + (volatility * 0.5));

  const moats = [
    "強固なブランド力と高い顧客ロイヤリティによる「広い堀」を確認。",
    "規模の経済による圧倒的なコスト優位性が競合を寄せ付けません。",
    "スイッチングコストが非常に高く、安定した収益源を確保しています。",
    "独自の特許ポートフォリオが競合他社に対する強力な参入障壁となっています。"
  ];
  const simplicities = [
    "ビジネスモデルは極めて単純明快。10年後も変わらぬ価値を提供し続けるでしょう。",
    "能力の輪のど真ん中。事業内容は誰にでも理解できる明瞭なものです。",
    "キャッシュを生成する仕組みが美しく、複雑な説明を必要としません。"
  ];
  const fcfTags = ["絶え間ないキャッシュの泉", "規律ある資本配分の証", "安定した現金創出力"];
  const epsGrowthTags = ["過去10年で力強い右肩上がり", "緩やかだが極めて堅実な成長", "不況下でも成長を維持"];

  const now = new Date();
  const timestamp = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  return {
    score,
    moat: moats[seed % moats.length],
    simplicity: simplicities[seed % simplicities.length],
    roe: parseFloat(roe.toFixed(1)),
    debtRatio,
    fcf: fcfTags[seed % fcfTags.length],
    grossMargin,
    epsGrowth: epsGrowthTags[seed % epsGrowthTags.length],
    capexRatio,
    per,
    summary: `${displayName}はバフェット流の基準において「${score > 85 ? "一級品" : "有望株"}」と診断されました。`,
    lastUpdated: timestamp
  };
};

// --- Helper Component for Metric ---
const MetricItem = ({ label, value, status, pass, criteria }: { label: string, value: string | number, status: string, pass: boolean, criteria: string }) => {
  const [showCriteria, setShowCriteria] = useState(false);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="text-[9px] font-bold text-slate-300 hover:text-blue-500 transition-colors uppercase cursor-pointer"
          >
            基準 {showCriteria ? '▲' : '▼'}
          </button>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-black text-slate-900">{value}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${pass ? 'text-emerald-600 bg-emerald-100' : 'text-amber-600 bg-amber-100'}`}>
            {status} {pass ? '✅' : '⚠️'}
          </span>
        </div>
      </div>
      {showCriteria && (
        <div className="px-3 pb-3 pt-1 bg-slate-50 border-t border-slate-50 animate-fade-in">
          <p className="text-[9px] font-medium text-slate-600 leading-relaxed border-l-2 border-blue-400 pl-2">
            {criteria}
          </p>
        </div>
      )}
    </div>
  );
};

const LOADING_MESSAGES = [
  "過去10年分の財務諸表を精査しています...",
  "経済的お堀の深さを計測中...",
  "経営陣の誠実さを評価しています...",
  "能力の輪の内側か判断しています...",
  "複利の魔法がかかるかシミュレーション中...",
];

// --- Mock Data ---
const MOCK_COMPANY_DB = [
  { symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", market: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corp.", market: "NASDAQ" },
  { symbol: "PLTR", name: "Palantir Technologies", market: "NYSE" },
  { symbol: "BRK.B", name: "Berkshire Hathaway", market: "NYSE" },
  { symbol: "TSLA", name: "Tesla, Inc.", market: "NASDAQ" },
  { symbol: "7203.T", name: "トヨタ自動車", market: "東証プライム" },
  { symbol: "8058.T", name: "三菱商事", market: "東証プライム" },
  { symbol: "9432.T", name: "日本電信電話 (NTT)", market: "東証プライム" },
  { symbol: "6758.T", name: "ソニーグループ", market: "東証プライム" },
  { symbol: "7974.T", name: "任天堂", market: "東証プライム" },
  { symbol: "9984.T", name: "ソフトバンクグループ", market: "東証プライム" },
  { symbol: "KO", name: "Coca-Cola Co.", market: "NYSE" },
];

export default function BuffettScreener() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof MOCK_COMPANY_DB>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<(AnalysisResult & { symbol: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFcfCriteria, setShowFcfCriteria] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("buffett_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem("buffett_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (query.trim() && showSuggestions) {
      const filtered = MOCK_COMPANY_DB.filter(
        item =>
          item.symbol.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, showSuggestions]);

  useEffect(() => {
    if (loading) {
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingText(LOADING_MESSAGES[i]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSearch = async (e: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = manualQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: finalQuery }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '分析に失敗しました。');
      }

      const data = await response.json();
      setResult({ ...data, symbol: finalQuery });
    } catch (err: any) {
      console.error(err);
      setError(err.message || '通信エラーが発生しました。環境変数や接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!result) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: result.symbol }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '更新に失敗しました。');
      }

      const data = await response.json();
      setResult({ ...data, symbol: result.symbol });
    } catch (err: any) {
      console.error(err);
      setError(err.message || '更新中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSelectSuggestion = (symbol: string) => {
    setQuery(symbol);
    setShowSuggestions(false);
    handleSearch(null as any, symbol);
  };

  const handleQuickAnalysis = (symbol: string) => {
    setQuery(symbol);
    handleSearch(null as any, symbol);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col p-4 shadow-xl">
      {/* Header */}
      <header className="py-10 text-center relative">
        {/* Softer background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-50 blur-[80px] rounded-full -z-10" />

        <div className="inline-flex flex-col items-center">
          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.4em] mb-1">
            Buffett Strategy
          </span>
          <h1 className="flex items-baseline gap-1.5 font-bold tracking-tight">
            <span className="text-3xl text-slate-800">
              BUFFETT
            </span>
            <span className="text-3xl text-blue-600 font-extrabold px-3 py-0.5 bg-blue-50 rounded-xl">
              SCORE
            </span>
          </h1>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Empowered by AI Analysis
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
        </div>
      </header>

      {/* Watchlist Chips */}
      <div className="mb-4">
        {favorites.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {favorites.map(fav => {
              const companyName = MOCK_COMPANY_DB.find(c => c.symbol === fav)?.name || fav;
              return (
                <button
                  key={fav}
                  onClick={() => handleQuickAnalysis(fav)}
                  className="flex-shrink-0 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm text-xs font-black text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-all active:scale-95"
                >
                  ★ {companyName}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 font-bold text-center py-2 animate-fade-in">
            ☆マークで銘柄をウォッチリストに追加できます
          </p>
        )}
      </div>

      {/* Search Input */}
      <div className="mb-8 relative">
        <div className="flex justify-between items-end mb-2 px-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            🔍 銘柄検索
          </label>
          <span className="text-[9px] text-slate-400 font-medium">
            米国株: MSFT / 日本株: 7203.T
          </span>
        </div>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={query}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="ティッカーシンボルを入力（例: AAPL, 7203.T）"
              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 transition-all font-medium shadow-sm pr-20 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-blue-700 hover:bg-blue-800 text-white px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-50 active:scale-95"
            >
              分析
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-fade-in text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Suggestion Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
            {suggestions.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleSelectSuggestion(item.symbol)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-none"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">{item.symbol}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.name}</span>
                </div>
                <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                  {item.market}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result UI */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-700 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-medium animate-pulse text-center px-4">
            {loadingText}
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="flex-1 space-y-6 animate-fade-in pb-10">
          {/* Total Score */}
          <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-slate-100 relative overflow-hidden">
            <div className="absolute top-4 left-4 flex flex-col items-start">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                最終更新: {result.lastUpdated}
              </span>
              <button
                onClick={handleRefresh}
                className="text-[10px] text-blue-600 font-black hover:text-blue-800 flex items-center gap-1 mt-0.5"
              >
                ↻ 更新
              </button>
            </div>
            <button
              onClick={() => toggleFavorite(result.symbol)}
              className="absolute top-4 right-4 text-2xl transition-all active:scale-125 hover:scale-110"
              title={favorites.includes(result.symbol) ? "お気に入り解除" : "お気に入り追加"}
            >
              {favorites.includes(result.symbol) ? "★" : "☆"}
            </button>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 mt-4">
              バフェット適合度
            </h2>
            <div className="text-7xl font-black text-blue-700">
              {result.score}
              <span className="text-2xl ml-1">点</span>
            </div>
            <p className="text-sm text-slate-600 font-bold mt-4">
              {result.summary}
            </p>
          </div>

          {/* Qualitative Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-500">
              <h3 className="text-xs font-black text-slate-400 uppercase mb-2">
                🏰 経済的お堀 (Moat)
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {result.moat}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-emerald-500">
              <h3 className="text-xs font-black text-slate-400 uppercase mb-2">
                ⭕ 能力の輪 (Competence)
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {result.simplicity}
              </p>
            </div>
          </div>

          {/* Quantitative Metrics Dashboard */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-6 text-center tracking-widest">
              📊 財務クオリティ・ダッシュボード
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <MetricItem
                label="ROE"
                value={`${result.roe}%`}
                status={result.roe >= 15 ? "GOOD" : "LOW"}
                pass={result.roe >= 15}
                criteria="株主のお金をどれだけ効率よく増やしているか。過去10年安定して15%以上が合格ライン。"
              />
              <MetricItem
                label="負債比率"
                value={result.debtRatio.toFixed(2)}
                status={result.debtRatio <= 1.0 ? "HEALTHY" : "HIGH"}
                pass={result.debtRatio <= 1.0}
                criteria="借金に頼らず利益を出しているか。利益で数年以内に完済できるレベルの借金を重視。"
              />
              <MetricItem
                label="粗利益率"
                value={`${result.grossMargin}%`}
                status={result.grossMargin >= 40 ? "WIDE" : "NARROW"}
                pass={result.grossMargin >= 40}
                criteria="他社に真似できない強み（お堀）があれば、価格競争に巻き込まれず40%以上をキープできる。"
              />
              <MetricItem
                label="設備投資比率"
                value={`${result.capexRatio}%`}
                status={result.capexRatio <= 25 ? "EFFICIENT" : "HEAVY"}
                pass={result.capexRatio <= 25}
                criteria="毎年莫大な設備投資をしないと地位を維持できないビジネスは避ける。純利益に対する割合が25%以下が目安。"
              />
              <MetricItem
                label="PER"
                value={result.per.toFixed(1)}
                status={result.per <= 20 ? "VALUED" : "PREMIUM"}
                pass={result.per <= 20}
                criteria="どんなに素晴らしい企業でも高値づかみはしない。市場全体と比較して割安な時に買う。"
              />
              <MetricItem
                label="成長性"
                value="安定成長"
                status="STABLE"
                pass={true}
                criteria="今年の利益だけでなく、過去10年にわたって右肩上がりで安定して稼ぎ続けているか。"
              />
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💎</span>
                    <span className="text-xs font-black text-blue-800 uppercase">キャッシュの質</span>
                  </div>
                  <button
                    onClick={() => setShowFcfCriteria(!showFcfCriteria)}
                    className="text-[9px] font-bold text-blue-400 hover:text-blue-600 transition-colors cursor-pointer uppercase"
                  >
                    基準 {showFcfCriteria ? '▲' : '▼'}
                  </button>
                </div>
                <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                  {result.fcf}。{result.epsGrowth}を確認。
                </p>
              </div>
              {showFcfCriteria && (
                <div className="px-4 pb-4 animate-fade-in bg-blue-100/30">
                  <p className="text-[9px] font-medium text-blue-800 leading-relaxed border-l-2 border-blue-400 pl-2">
                    帳簿上の利益ではなく、実際に自由に使える「現金」を毎年安定して稼ぎ出しているか。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 mt-auto">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          ※本アプリはAIによる分析シミュレーションであり、投資助言ではありません。<br />
          投資の最終判断はご自身で行ってください。
        </p>
      </footer>
    </main>
  );
}
