import React from "react";
import type { ReactNode } from "react";

interface ChatMessageProps {
  role: "user" | "ai";
  children: ReactNode;
}

export function ChatMessage({ role, children }: Readonly<ChatMessageProps>) {
  if (role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-br-md px-5 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{children}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      {/* AI Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
        <span
          className="material-symbols-outlined text-primary text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 bg-surface-container-low rounded-2xl rounded-tl-md px-5 py-4 shadow-sm border border-outline-variant/5">
        {children}
      </div>
    </div>
  );
}
