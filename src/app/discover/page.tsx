"use client";

import React, { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ChatInput } from "@/components/AiChat/ChatInput";
import { ChatMessage } from "@/components/AiChat/ChatMessage";
import { askAI } from "./actions";
import { ChatProvider } from "@/components/AiChat/ChatContext";
import { AiChatResponse } from "@/components/AiChat/AiChatResponse";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  toolStocks?: any[];
  toolAnalysis?: any;
}

export default function DiscoverPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = React.useCallback(async (text: string) => {
    if (isLoading) return;

    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: text },
    ]);

    setIsLoading(true);

    try {
      const { output, toolStocks, toolAnalysis } = await askAI(text);
      if (output || toolStocks || toolAnalysis) {
        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            role: "ai", 
            content: output || "", 
            toolStocks,
            toolAnalysis
          },
        ]);
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: "ai", 
          content: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    (window as any).sendChatFromCard = (text: string) => handleSendMessage(text);
    return () => { delete (window as any).sendChatFromCard; };
  }, [handleSendMessage]);

  return (
    <Layout>
      <ChatProvider sendMessage={handleSendMessage}>
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto">
          <div className="px-6 py-8 text-center text-on-surface">
            <h2 className="text-3xl font-headline font-bold italic mb-2">AI探索</h2>
            <p className="text-sm font-label uppercase tracking-widest opacity-60">Discover your next masterpiece</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-6 pb-8 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40 py-10">
                <span className="material-symbols-outlined text-6xl">explore</span>
                <p className="font-headline italic text-lg">「ウォーレン・バフェットなら、何を探すだろうか？」</p>
              </div>
            )}

            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role}>
                {m.role === "ai" ? (
                  <AiChatResponse 
                    content={m.content} 
                    toolStocks={m.toolStocks} 
                    toolAnalysis={m.toolAnalysis} 
                  />
                ) : (
                  m.content
                )}
              </ChatMessage>
            ))}

            {isLoading && (
              <div className="flex gap-3 animate-pulse">
                <div className="shrink-0 w-8 h-8 rounded-full bg-surface-container-high"></div>
                <div className="h-20 bg-surface-container-low rounded-2xl w-full"></div>
              </div>
            )}
          </div>

          <div className="sticky bottom-[72px] z-30 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 px-4 py-4 -mx-4">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </ChatProvider>
    </Layout>
  );
}
