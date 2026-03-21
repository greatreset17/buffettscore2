import React from 'react';
import { STOCK_INPUT_CONTENT } from '@/data/mockData';

export const HeroSection: React.FC = () => {
  return (
    <section className="w-full text-center mb-12 animate-fade-in">
      <h2 className="font-sans text-3xl md:text-5xl font-extrabold text-on-surface mb-4 leading-tight tracking-tighter whitespace-nowrap">
        {STOCK_INPUT_CONTENT.hero.title}
      </h2>
      <p className="text-on-surface-variant font-body text-base lg:text-lg max-w-lg mx-auto leading-relaxed">
        {STOCK_INPUT_CONTENT.hero.description}
      </p>
    </section>
  );
};
