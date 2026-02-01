'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleId?: string;
  articleTitle?: string;
}

export function AIPanel({ isOpen, onClose, articleId, articleTitle }: AIPanelProps) {
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
    if (articleId && articleTitle) {
      setMessages([]);
    }
  }, [articleId, articleTitle]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
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

  const quickActions = [
    { label: 'Summarize', prompt: 'Give me a brief summary of this article in 3 bullet points' },
    { label: 'Key takeaways', prompt: 'What are the key takeaways from this article?' },
    { label: 'Content ideas', prompt: 'Suggest 5 content ideas I could create based on this article' },
    { label: 'Explain simply', prompt: 'Explain the main concepts in this article in simple terms' },
    { label: 'LinkedIn post', prompt: 'Write a LinkedIn post about this article' },
    { label: 'Tweet thread', prompt: 'Create a Twitter/X thread about this article (5 tweets)' },
  ];

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="font-semibold text-gray-900">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
          title="Close panel"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Article context */}
      {articleTitle && (
        <div className="px-4 py-3 bg-purple-50 border-b">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Discussing</p>
          <p className="text-sm text-purple-900 font-medium truncate mt-0.5">{articleTitle}</p>
        </div>
      )}

      {/* Quick actions */}
      {articleId && messages.length === 0 && (
        <div className="p-4 border-b">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => sendMessage(action.prompt)}
                disabled={loading}
                className="px-3 py-2 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!articleId && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-gray-600 mb-2">
              Select an article and click <strong>Ask AI</strong> to get started.
            </p>
            <p className="text-sm text-gray-400">
              Or type a general question below.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
            <div
              className={`max-w-[90%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex">
            <div className="bg-gray-100 rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={articleId ? "Ask about this article..." : "Ask anything..."}
            rows={1}
            className="flex-1 px-4 py-2.5 border rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          GPT-4o • Enter to send
        </p>
      </div>
    </div>
  );
}
