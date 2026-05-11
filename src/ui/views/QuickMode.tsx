import React, { useState } from 'react';
import { ActionButton } from '../components/ActionButton';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuickModeProps {
  callTool: (name: string, args: any) => Promise<any>;
}

export function QuickMode({ callTool }: QuickModeProps) {
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGo = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    try {
      const res = await callTool('bmad_quick', { intent });
      if (res && res.message) {
        setResult(res.message);
      }
    } catch (e) {
      setResult('Error executing quick mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto h-full flex flex-col items-center justify-center gap-6">
      <div className="w-full text-center mb-4">
        <h1 className="text-4xl font-bold mb-4 text-blue-400">Quick Mode</h1>
        <p className="text-gray-400">Execute rapid one-shot actions across your project.</p>
      </div>

      <div className="w-full flex gap-3">
        <input 
          type="text" 
          value={intent}
          onChange={e => setIntent(e.target.value)}
          placeholder="Describe what you want to do..." 
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-lg text-gray-100 focus:outline-none focus:border-blue-500"
          onKeyDown={e => e.key === 'Enter' && handleGo()}
        />
        <ActionButton onClick={handleGo} loading={loading} className="px-8 text-lg">Go</ActionButton>
      </div>

      {result && (
        <div className="w-full mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6 prose prose-invert max-w-none overflow-y-auto max-h-[50vh]">
          <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
        </div>
      )}
    </div>
  );
}
