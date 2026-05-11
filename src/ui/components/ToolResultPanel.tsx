import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ToolResultPanelProps {
  result: string | null;
  onDismiss: () => void;
}

export function ToolResultPanel({ result, onDismiss }: ToolResultPanelProps) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl flex flex-col m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-gray-100">Tool Result</h3>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-100 transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
        </div>
      </div>
    </div>
  );
}
