import React, { useState } from 'react';
import { Agent } from '../../shared/types';
import { ActionButton } from './ActionButton';

interface AgentCardProps {
  agent: Agent;
  onLaunch?: (code: string) => void;
}

export function AgentCard({ agent, onLaunch }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl bg-gray-900 w-12 h-12 rounded-full flex items-center justify-center">
            {agent.emoji}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">{agent.name}</h3>
            <p className="text-sm text-gray-400">{agent.role}</p>
          </div>
        </div>
        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
          {agent.phase}
        </span>
      </div>
      
      {agent.outputsExist && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          Outputs ready
        </div>
      )}

      <button onClick={() => setExpanded(!expanded)} className="text-sm text-blue-400 text-left mt-2 hover:underline">
        {expanded ? 'Hide Triggers' : 'View Triggers'}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 mt-2">
          {agent.triggerCodes.map(tc => (
            <div key={tc.code} className="bg-gray-900 p-2 rounded border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-300">{tc.code}</span>
                <ActionButton variant="secondary" className="px-2 py-1 text-xs" onClick={() => onLaunch?.(tc.code)}>
                  Launch
                </ActionButton>
              </div>
              <p className="text-xs text-gray-400 mt-1">{tc.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
