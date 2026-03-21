"use client";

import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem("google_genai_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem("google_genai_api_key", apiKey);
    alert("Settings updated successfully.");
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
            System Preferences
          </span>
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-on-surface -mt-2">
            Settings
          </h2>
        </div>

        <div className="space-y-6">
          {/* API Configuration */}
          <section className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
            <h3 className="font-sans text-xl font-bold text-on-surface mb-6">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                  Gemini API Key
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Google Gemini API Key"
                    className="w-full bg-surface-container-low border-none rounded-xl h-14 px-5 font-body text-on-surface focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant">
                    key
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-on-surface-variant opacity-60 font-body leading-relaxed">
                  Required for AI-driven stock analysis. Your key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            </div>
          </section>

          {/* Theme Configuration */}
          <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 shadow-sm">
            <h3 className="font-sans text-xl font-bold text-on-surface mb-6">Interface Aesthetics</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-outline-variant/10 bg-surface-container-lowest text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-3xl">light_mode</span>
                <span className="font-label text-[10px] font-bold uppercase tracking-widest">Light Mode</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-outline-variant/10 bg-surface-container-lowest text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-3xl">dark_mode</span>
                <span className="font-label text-[10px] font-bold uppercase tracking-widest">Dark Mode</span>
              </button>
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full bg-on-surface text-surface py-5 rounded-xl font-bold text-lg tracking-widest hover:scale-[0.99] active:scale-95 transition-all shadow-xl shadow-on-surface/10"
            >
              Apply Changes
            </button>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/30">
            Buffett Score Version 2.0.0
          </p>
        </div>
      </div>
    </Layout>
  );
}
