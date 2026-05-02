"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "例: 半導体関連で割安な銘柄を教えて",
}: Readonly<ChatInputProps>) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-surface border-t border-outline-variant/10 px-4 py-3 pb-safe">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={placeholder}
            className="w-full resize-none bg-surface-container-low rounded-2xl px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/40 border border-outline-variant/10 focus:border-primary/30 focus:ring-0 focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <span className="material-symbols-outlined text-lg animate-spin">
              progress_activity
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              arrow_upward
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
