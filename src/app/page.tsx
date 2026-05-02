"use client";

import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/StockInput/HeroSection";
import { SearchHub } from "@/components/Search/SearchHub";
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
    setTimeout(() => {
      setLoading(false);
      router.push(`/analyze/${ticker.toUpperCase()}`);
    }, 2500);
  };

  return (
    <Layout>
      <HeroSection />
      <SearchHub onSearch={handleSearch} isLoading={loading} />
      <FeatureCards />
      <FooterQuote />
    </Layout>
  );
}
