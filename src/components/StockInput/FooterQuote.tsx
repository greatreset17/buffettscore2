import React from 'react';
import { STOCK_INPUT_CONTENT } from '@/data/mockData';

export const FooterQuote: React.FC = () => {
  return (
    <div className="md:col-span-2 py-12 px-4 border-y border-outline-variant/20 flex flex-col items-center text-center mt-16 animate-fade-in delay-500">
      <p className="font-headline italic text-xl text-on-surface-variant max-w-xl leading-relaxed">
        {STOCK_INPUT_CONTENT.footer.quote}
      </p>
      <span className="mt-4 font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/40">
        Institutional Wisdom — {STOCK_INPUT_CONTENT.footer.author}
      </span>
    </div>
  );
};
