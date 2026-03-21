import React from 'react';
import { TopAppBar, BottomNavBar } from './Navigation';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface transition-colors duration-300">
      <TopAppBar />
      <main className="max-w-md mx-auto pb-32 px-6 pt-8 animate-fade-in">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
};
