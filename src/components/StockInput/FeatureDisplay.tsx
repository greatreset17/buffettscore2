import React from 'react';
import { STOCK_INPUT_CONTENT } from '@/data/mockData';

export const MarketIntelligence: React.FC = () => {
  const { marketIntelligence: data } = STOCK_INPUT_CONTENT;
  return (
    <div className="w-full mt-16 animate-fade-in delay-200">
      <div className="bg-on-secondary-fixed text-fixed-surface-text p-8 rounded-lg relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h4 className="font-sans text-2xl text-primary-container mb-2">{data.label}</h4>
          <p className="text-fixed-surface-text-variant text-sm font-body leading-snug mb-6">{data.description}</p>
          <div className="text-4xl font-sans font-bold flex items-baseline gap-2 text-fixed-surface-text">
            {data.title.split(': ')[1]}
            <span className="text-lg text-fixed-surface-text-variant/70 font-label">pts</span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fixed-surface-text/10 border border-fixed-surface-text/10 text-[10px] font-label font-bold uppercase tracking-widest text-primary-container">
            <span className="material-symbols-outlined text-xs">bolt</span>
            {data.status}
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            monitoring
          </span>
        </div>
      </div>
    </div>
  );
};

export const FeatureCards: React.FC = () => {
  return (
    <div className="mt-16 flex flex-col gap-8 w-full">
      {STOCK_INPUT_CONTENT.features.map((feature, idx) => (
        <div
          key={idx}
          className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex flex-col items-center text-center animate-rise-in card-interactive hover:border-outline-variant/20"
          style={{ animationDelay: `${300 + idx * 100}ms` }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-2xl text-primary">{feature.icon}</span>
          </div>
          <h4 className="font-sans text-xl font-bold mb-3 text-on-surface uppercase tracking-tight">{feature.title}</h4>
          <p className="text-sm text-on-surface-variant font-body leading-relaxed max-w-sm">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
};
