"use client";
import React, { useState, useEffect, useRef } from 'react';
import { STOCK_INPUT_CONTENT } from '@/data/mockData';

interface DiagnosisInputProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

interface SearchResult {
  ticker: string;
  name: string;
  exch: string;
  type: string;
}

export const DiagnosisInput: React.FC<Readonly<DiagnosisInputProps>> = ({ onSearch, isLoading }) => {
  const [ticker, setTicker] = useState('');
  const [activeTab, setActiveTab] = useState('日本株');
  const [progress, setProgress] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isLoading]);

  // Debounced search logic
  useEffect(() => {
    if (ticker.length > 1) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      
      debounceRef.current = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const marketParam = activeTab === '日本株' ? 'JP' : 'US';
          const res = await fetch(`/api/search?q=${encodeURIComponent(ticker)}&market=${marketParam}`);
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [ticker, activeTab]);

  const handleSelect = (symbol: string) => {
    setTicker(symbol);
    setShowSuggestions(false);
    onSearch(symbol);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-fade-in delay-100">
      {/* Tab Navigation */}
      <div className="flex justify-center p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
        {STOCK_INPUT_CONTENT.cta.tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-label font-bold tracking-widest uppercase transition-all duration-300 ${
              activeTab === tab
                ? 'bg-surface-container-high text-primary shadow-lg ring-1 ring-primary/20'
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Input Field Area */}
      <div className="relative group z-50">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary-container/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
        <div className="relative flex flex-col items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-surface-container-lowest border-none text-center text-sm sm:text-lg md:text-xl font-sans font-semibold py-5 px-4 rounded-xl focus:ring-0 placeholder:text-outline-variant/50 placeholder:font-light text-on-surface shadow-inner"
              placeholder={STOCK_INPUT_CONTENT.cta.placeholder}
            />

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                {suggestions.map((item) => (
                  <div 
                    key={item.ticker}
                    onClick={() => handleSelect(item.ticker)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-primary/5 cursor-pointer border-b border-outline-variant/5 group transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-on-surface text-lg group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                        {item.ticker} · {item.exch}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      add_circle
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 w-full flex flex-col items-center">
            <button
              onClick={() => onSearch(ticker)}
              disabled={isLoading || !ticker}
              className="w-full md:w-auto md:px-16 py-5 bg-primary-container text-on-primary font-bold text-lg tracking-widest rounded-md hover:scale-[0.98] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="group-hover:translate-x-[-2px] transition-transform">
                {isLoading ? "分析中..." : "採点する"}
              </span>
              <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
                {isLoading ? "sync" : "insights"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status / Analysis Progress */}
      {isLoading && (
        <div className="mt-12 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 rounded-xl bg-surface-container-low border-l-4 border-primary/40 relative overflow-hidden shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-1">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-label font-bold text-xs uppercase tracking-[0.2em] text-primary mb-2">System Status</h3>
                <p className="text-on-surface font-body italic text-lg transition-all duration-500">
                  {progress < 30 ? "Fetching market data..." : 
                   progress < 60 ? "Analysing financial statements..." : 
                   "Calculating Moat Score..."}
                </p>
                <div className="mt-4 w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-label font-medium uppercase tracking-tighter text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xs ${progress > 40 ? 'text-primary' : 'text-outline-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {progress > 40 ? 'check_circle' : 'pending'}
                    </span>
                    <span>Market Data Retrieval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xs ${progress > 70 ? 'text-primary' : 'text-outline-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {progress > 70 ? 'check_circle' : 'pending'}
                    </span>
                    <span>Intrinsic Valuation</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}
    </div>
  );
};
