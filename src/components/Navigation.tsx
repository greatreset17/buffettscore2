"use client";

import React from 'react';
import { STOCK_INPUT_CONTENT } from '@/data/mockData';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const TopAppBar: React.FC = () => {
  return (
    <header className="bg-surface sticky top-0 z-40 border-b border-outline-variant/10 shadow-sm">
      <div className="flex justify-between items-center w-full px-6 h-16 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-surface-container-low transition-colors rounded-lg active:scale-95 duration-200">
            <span className="material-symbols-outlined text-on-surface-variant">menu</span>
          </button>
          <h1 className="text-xl font-sans font-bold tracking-tighter uppercase text-gold">
            BUFFETT'S WISDOM
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
            <img 
              alt="User" 
              src={STOCK_INPUT_CONTENT.header.userProfileUrl} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export const BottomNavBar: React.FC = () => {
  const pathname = usePathname();
  
  const navItems = [
    { label: '銘柄診断', icon: 'add_chart', href: '/' },
    { label: 'AI探索', icon: 'explore', href: '/discover' },
    { label: '履歴', icon: 'history', href: '/history' },
    { label: '設定', icon: 'settings', href: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-3 bg-surface/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-outline-variant/10">
      <div className="flex justify-around items-center w-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 ${
                isActive 
                  ? 'text-gold-bright scale-115' 
                  : 'text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}
            >
              <span 
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-label text-[10px] font-bold uppercase tracking-tight mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
