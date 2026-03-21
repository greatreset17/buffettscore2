"use client";

import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/StockInput/HeroSection";
import { DiagnosisInput } from "@/components/StockInput/DiagnosisInput";
import { FeatureCards } from "@/components/StockInput/FeatureDisplay";
import { FooterQuote } from "@/components/StockInput/FooterQuote";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (ticker: string) => {
    if (!ticker) return;
    setLoading(true);
    // Real analysis routing
    setTimeout(() => {
      setLoading(false);
      router.push(`/analyze/${ticker.toUpperCase()}`);
    }, 2500); // Give time for the progress animation to show
  };

  return (
    <Layout>
      <HeroSection />
      <DiagnosisInput onSearch={handleSearch} isLoading={loading} />
      <FeatureCards />
      <FooterQuote />
    </Layout>
  );
}
