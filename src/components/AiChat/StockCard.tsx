"use client";

export interface StockCardData {
  id: number;
  symbol: string;
  name: string;
  description: string;
  similarity: number;
  market?: string;
}

interface StockCardProps {
  stock: StockCardData;
  onAnalyze?: (ticker: string) => void;
}

export function StockCard({ stock, onAnalyze }: Readonly<StockCardProps>) {
  const similarityPct = Math.round(stock.similarity * 100);
  const desc =
    stock.description && stock.description !== "N/A"
      ? stock.description.substring(0, 120) + "..."
      : "事業概要は取得できませんでした。";

  return (
    <div 
      onClick={() => {
        const sendFn = (window as any).sendChatFromCard;
        if (sendFn) {
          sendFn(`【分析コマンド】TARGET_TICKER: ${stock.symbol} の詳細分析を実行せよ`);
        }
        onAnalyze?.(stock.symbol);
      }}
      className="group relative bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 shadow-sm card-interactive hover:border-primary/20 active:scale-[0.98] cursor-pointer"
    >
      {/* ... */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
            similarityPct >= 70
              ? "bg-success-container text-on-success-container"
              : similarityPct >= 50
                ? "bg-warning-container text-on-warning-container"
                : "bg-outline-variant/10 text-on-surface-variant"
          }`}
        >
          {similarityPct}% match
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">
            {stock.symbol.substring(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-sans font-bold text-on-surface text-sm truncate">
            {stock.name}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono text-xs font-semibold">
              {stock.symbol}
            </span>
            {stock.market && (
              <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded font-label">
                {stock.market}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-on-surface-variant text-xs leading-relaxed mb-4 line-clamp-3">
        {desc}
      </p>

      {/* Action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          const sendFn = (window as any).sendChatFromCard;
          if (sendFn) {
            sendFn(`【分析コマンド】TARGET_TICKER: ${stock.symbol} の詳細分析を実行せよ`);
          }
          onAnalyze?.(stock.symbol);
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-label font-bold uppercase tracking-wider transition-all duration-200 group-hover:bg-primary group-hover:text-on-primary"
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          query_stats
        </span>
        詳しく評価する
      </button>
    </div>
  );
}
