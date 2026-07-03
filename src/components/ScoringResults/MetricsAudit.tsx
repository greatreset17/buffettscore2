"use client";
import React from 'react';

export const MetricsGrid: React.FC<{ metrics: any[]; openModal: (t: string, c: string) => void }> = ({ metrics, openModal }) => {
  return (
    <div className="p-6 bg-surface-container-lowest rounded-lg border-l-4 border-primary-container shadow-sm animate-fade-in">
      <h4 className="text-xs font-bold text-secondary tracking-widest mb-6 uppercase">定量評価 (Quantitative)</h4>
      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
        {metrics.map((metric: any, idx: number) => {
          const isHighGrade = ['S', 'A+', 'A'].includes(metric.grade);
          return (
            <div
              key={metric.label}
              className="relative animate-fade-in"
              style={{ animationDelay: `${100 + idx * 60}ms` }}
            >
              <div className="flex items-center gap-1 mb-1">
                <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
                  {metric.label}
                </p>
                <button 
                  onClick={() => openModal(metric.label, metric.description)}
                  className="text-on-surface-variant/30 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">info</span>
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="font-headline text-xl font-bold leading-none text-on-surface italic">
                  {metric.value}
                </p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${
                    isHighGrade 
                    ? 'text-primary bg-primary/10' 
                    : 'text-outline bg-secondary-container/30'
                }`}>
                  {metric.grade}
                </span>
              </div>
              <p className={`text-[9px] font-medium mt-1 uppercase tracking-widest ${
                isHighGrade ? 'text-primary' : 'text-outline'
              }`}>
                {metric.status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const QualitativeAudit: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <section className="bg-surface-container-low p-8 rounded-xl shadow-sm animate-fade-in delay-300 mt-8">
      <h3 className="text-xl font-headline font-bold italic text-on-surface mb-6">定性評価 (Qualitative)</h3>
      
      <div className="grid grid-cols-1 gap-8">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="space-y-4 animate-fade-in"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] text-primary font-bold uppercase tracking-[0.2em]">{item.label}</span>
              <h4 className="font-sans text-xl font-bold text-on-surface">{item.subLabel}</h4>
            </div>
            <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  ['強力', '優位', '卓越', '盤石'].some(s => item.status?.includes(s))
                    ? 'bg-primary/20 text-primary'
                    : 'bg-tertiary/20 text-tertiary'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                {item.description || item.content || "詳細な分析内容は現在生成中です。"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
        </div>
        <p className="font-sans text-xs text-on-surface-variant leading-snug">
          Institutional-grade economic moat verified by Buffett methodology.
        </p>
      </div>
    </section>
  );
};
