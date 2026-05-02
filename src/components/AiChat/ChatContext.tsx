"use client";

import React, { createContext, useContext } from "react";

interface ChatContextType {
  sendMessage: (message: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ 
  children, 
  sendMessage 
}: { 
  children: React.ReactNode; 
  sendMessage: (message: string) => void;
}) {
  return (
    <ChatContext.Provider value={{ sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    // Return a fallback or throw. Let's return undefined to handle it gracefully in cards.
    return undefined;
  }
  return context;
}
