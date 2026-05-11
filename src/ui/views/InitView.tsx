import React, { useState } from 'react';
import { Track } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';

interface InitViewProps {
  callTool: (name: string, args: any) => Promise<any>;
  onInitComplete: () => void;
}

const TRACKS: { id: Track; label: string; description: string }[] = [
  { id: 'quick', label: 'Quick', description: 'Fast-track for small projects. Minimal ceremony, maximum velocity.' },
  { id: 'bmad', label: 'Standard BMad', description: 'Full BMad Method with structured phases, agents, and deliverables.' },
  { id: 'enterprise', label: 'Enterprise', description: 'Extended governance, compliance gates, and multi-team coordination.' },
];

export function InitView({ callTool, onInitComplete }: InitViewProps) {
  const [selectedTrack, setSelectedTrack] = useState<Track>('bmad');
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    setLoading(true);
    try {
      await callTool('bmad_orchestrate', {
        skill: '/bmad-product-brief',
        triggerCode: 'init',
        context: { track: selectedTrack },
      });
      onInitComplete();
    } catch {
      // Still refresh — the MCP host may have handled it
      onInitComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[800px] p-8">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-3xl font-bold text-white">BM</div>
          <h1 className="text-4xl font-bold text-gray-100">Welcome to BMad</h1>
          <p className="text-gray-400 text-lg max-w-md">
            Initialize your project with the BMad Method to get structured workflows, agents, and phase-gated delivery.
          </p>
        </div>

        <div className="w-full">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Select Track</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRACKS.map(track => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedTrack === track.id
                    ? 'bg-blue-600/20 border-blue-500 text-gray-100'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-bold mb-1">{track.label}</div>
                <div className="text-sm text-gray-400">{track.description}</div>
              </button>
            ))}
          </div>
        </div>

        <ActionButton onClick={handleInit} loading={loading} className="text-xl px-8 py-4">
          Initialize BMad
        </ActionButton>
      </div>
    </div>
  );
}
