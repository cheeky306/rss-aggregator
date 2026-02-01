'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { ChatPanel, ChatToggle } from './ChatPanel';

interface ChatContextType {
  openChat: (articleId?: string, articleTitle?: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [articleId, setArticleId] = useState<string | undefined>();
  const [articleTitle, setArticleTitle] = useState<string | undefined>();

  const openChat = (id?: string, title?: string) => {
    setArticleId(id);
    setArticleTitle(title);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <ChatContext.Provider value={{ openChat, closeChat }}>
      {children}
      <ChatToggle onClick={() => openChat()} hasArticle={!!articleId} />
      <ChatPanel
        isOpen={isOpen}
        onClose={closeChat}
        articleId={articleId}
        articleTitle={articleTitle}
      />
    </ChatContext.Provider>
  );
}
