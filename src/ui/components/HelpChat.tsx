import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelpMessage } from '../../shared/types';

interface HelpChatProps {
  isOpen: boolean;
  onClose: () => void;
  callTool: (name: string, args: any) => Promise<any>;
}

export function HelpChat({ isOpen, onClose, callTool }: HelpChatProps) {
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextCount, setContextCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      callTool('bmad_context_status', {}).then((status: any) => {
        setContextCount(status?.help ?? 0);
      }).catch(() => {});
    }
  }, [isOpen, messages.length, callTool]);

  const handleReset = async () => {
    await callTool('bmad_reset_context', { workflow: 'help' });
    setMessages([]);
    setContextCount(0);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: HelpMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const result = await callTool('bmad_help', { message: userMsg.content });
      const assistantMsg: HelpMessage = typeof result === 'object' && result.role
        ? result
        : { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result), timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      setContextCount(prev => prev + 2);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-gray-800 border-l border-gray-700 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-100">BMad Help</h2>
          {contextCount > 0 && (
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{contextCount} msgs</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="text-xs text-gray-400 hover:text-blue-400 border border-gray-600 rounded px-2 py-1">New Chat</button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl">&times;</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm text-center mt-8">Ask me anything about BMad Method...</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about BMad Method..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
