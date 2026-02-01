'use client';

import { useState, createContext, useContext, ReactNode } from 'react';

interface AIContextType {
  isOpen: boolean;
  articleId?: string;
  articleTitle?: string;
  openAI: (articleId?: string, articleTitle?: string) => void;
  closeAI: () => void;
  toggleAI: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [articleId, setArticleId] = useState<string | undefined>();
  const [articleTitle, setArticleTitle] = useState<string | undefined>();

  const openAI = (id?: string, title?: string) => {
    setArticleId(id);
    setArticleTitle(title);
    setIsOpen(true);
  };

  const closeAI = () => {
    setIsOpen(false);
  };

  const toggleAI = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <AIContext.Provider value={{ isOpen, articleId, articleTitle, openAI, closeAI, toggleAI }}>
      {children}
    </AIContext.Provider>
  );
}
