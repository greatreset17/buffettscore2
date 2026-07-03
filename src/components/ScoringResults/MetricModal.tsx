"use client";
import React from 'react';

interface MetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const MetricModal: React.FC<Readonly<MetricModalProps>> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-scrim backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="text-lg font-sans font-bold text-primary">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-8">
          <p className="text-on-surface-variant leading-relaxed text-sm">{content}</p>
        </div>
        <div className="p-6 bg-surface-container-low flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-primary text-on-primary text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            閉じる
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};
