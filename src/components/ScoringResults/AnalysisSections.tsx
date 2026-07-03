import React from 'react';
import { SCORING_RESULTS_MOCK } from '@/data/mockData';

export const InvestmentThesis: React.FC<{ data?: any[] }> = ({ data }) => {
  const items = data || SCORING_RESULTS_MOCK.thesis;
  return (
    <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm animate-fade-in delay-600 mt-8">
      <h3 className="text-xl font-headline font-bold italic text-on-surface mb-6">投資見解 (Investment Thesis)</h3>
      
      <div className="grid grid-cols-1 gap-6">
        {items.map((item: any, idx: number) => (
          <div
            key={idx}
            className="space-y-4 animate-fade-in"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              {item.title}
            </h4>
            <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
              <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                {item.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const RadarChart: React.FC<{ data: number[] }> = ({ data }) => {
  const points = [
    { x: 50, y: 10, label: "収益性" },
    { x: 90, y: 40, label: "成長性" },
    { x: 75, y: 90, label: "経済的堀" },
    { x: 25, y: 90, label: "安全域" },
    { x: 10, y: 40, label: "資本配分" },
  ];

  const valuePoints = data.map((val, i) => {
    const p = points[i] || points[0];
    const factor = (val || 0) / 100;
    return {
      x: 50 + (p.x - 50) * factor,
      y: 50 + (p.y - 50) * factor,
    };
  });

  const pathData = valuePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto animate-fade-in delay-500 py-8">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Background Grids */}
        {[20, 40, 60, 80, 100].map((level) => (
          <polygon
            key={level}
            points={points.map(p => {
              const f = level / 100;
              return `${50 + (p.x - 50) * f},${50 + (p.y - 50) * f}`;
            }).join(" ")}
            className="fill-none stroke-outline-variant/10 stroke-[0.5]"
          />
        ))}
        {/* Radial Axis */}
        {points.map((p, i) => (
          <line
            key={i}
            x1="50" y1="50" x2={p.x} y2={p.y}
            className="stroke-outline-variant/10 stroke-[0.5]"
          />
        ))}
        {/* Data Area */}
        <path
          d={pathData}
          className="fill-primary/10 stroke-primary stroke-[1] transition-all duration-1000 ease-out"
        />
        {/* Labels Content */}
        {points.map((p, i) => (
          <text
            key={i}
            x={50 + (p.x - 50) * 1.3}
            y={50 + (p.y - 50) * 1.3}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-sans text-[4px] font-bold fill-on-surface-variant uppercase tracking-normal"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
