"use client";

import { use } from "react";
import { Layout } from "@/components/Layout";
import { StockHeader, ScoreCard } from "@/components/ScoringResults/ScoreHeader";
import { MetricsGrid, QualitativeAudit } from "@/components/ScoringResults/MetricsAudit";
import { InvestmentThesis, RadarChart } from "@/components/ScoringResults/AnalysisSections";
import { MetricModal } from "@/components/ScoringResults/MetricModal";
import { useState, useEffect } from "react";

export default function AnalysisPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState({ open: false, title: '', content: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = localStorage.getItem("google_genai_api_key");
        const headers: any = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ticker }),
        });
        
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  const openModal = (title: string, content: string) => {
    setModal({ open: true, title, content });
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="font-headline italic text-on-surface-variant">Performing Deep Analysis...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Analysis Failed</h2>
        <p className="text-on-surface-variant max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 bg-surface-container-high rounded-full font-label font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6 pb-24">
        {/* Header Section */}
        <StockHeader ticker={data.ticker} name={data.name} />
        
        {/* Score & Summary Section */}
        <ScoreCard score={data.score} summary={data.summary} />
        
        {/* Main Analysis Sections */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Visual Analysis */}
          <section className="bg-surface-container-low rounded-xl p-8 shadow-sm border border-outline-variant/5">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-headline font-bold italic text-on-surface">分析ポートフォリオ</h3>
               <div className="flex gap-2">
                 <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold tracking-wider rounded-full uppercase">Institutional Quality</span>
               </div>
             </div>
             <div className="flex flex-col items-center gap-6">
               <RadarChart data={data.metrics.map((m: any) => 
                 m.grade === 'S' ? 100 : m.grade === 'A+' ? 95 : m.grade === 'A' ? 85 : m.grade === 'B' ? 70 : 50
               ).slice(0, 5)} />
               
               <MetricsGrid metrics={data.metrics} openModal={openModal} />
             </div>
          </section>

          {/* Qualitative Moat Assessment */}
          <QualitativeAudit data={data.qualitative} />
          
          {/* Investment Thesis */}
          <InvestmentThesis data={data.thesis} />
        </div>
      </div>

      <MetricModal 
        isOpen={modal.open} 
        onClose={() => setModal({ ...modal, open: false })} 
        title={modal.title} 
        content={modal.content} 
      />
    </Layout>
  );
}
