'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: string;
  articleTitle?: string;
}

export function ChatPanel({ isOpen, onClose, articleId, articleTitle }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset chat when article changes
  useEffect(() => {
    if (articleId) {
      setMessages([{
        role: 'assistant',
        content: `I'm ready to help you with "${articleTitle}". You can ask me to:\n\n• Summarize the key points\n• Explain concepts in detail\n• Suggest content angles\n• Compare with other news\n\nWhat would you like to know?`
      }]);
    }
  }, [articleId, articleTitle]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          articleId,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    'Summarize this article',
    'What are the key takeaways?',
    'Suggest content ideas',
    'Explain in simple terms',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {articleTitle && (
          <p className="text-sm text-purple-100 mt-1 truncate">
            Discussing: {articleTitle}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-gray-600 mb-4">
              Ask me anything about your news feed!
            </p>
            <div className="space-y-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts when chatting about an article */}
      {articleId && messages.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50 flex gap-2 overflow-x-auto">
          {['Key points?', 'Content ideas?', 'Explain more'].map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInput(prompt)}
              className="flex-shrink-0 px-3 py-1 text-xs bg-white border rounded-full hover:bg-gray-100 text-gray-600"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 px-4 py-2 border rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Powered by GPT-4o • Press Enter to send
        </p>
      </div>
    </div>
  );
}

// Chat toggle button
export function ChatToggle({ onClick, hasArticle }: { onClick: () => void; hasArticle?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-40"
      title="Open AI Assistant"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {hasArticle && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
      )}
    </button>
  );
}
