import React from 'react';
import { Phase } from '../../shared/types';

interface PhaseIndicatorProps {
  currentPhase: Phase | null;
  onPhaseClick?: (phase: Phase) => void;
}

const PHASES: Phase[] = ['analysis', 'planning', 'solutioning', 'implementation'];

export function PhaseIndicator({ currentPhase, onPhaseClick }: PhaseIndicatorProps) {
  const currentIndex = currentPhase ? PHASES.indexOf(currentPhase) : -1;
  return (
    <div className="flex w-full items-center justify-between">
      {PHASES.map((phase, index) => {
        const isCompleted = currentIndex > -1 && index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = currentIndex > -1 && index > currentIndex;
        
        let colorClass = 'text-gray-400 bg-gray-700 border-gray-600';
        if (isCompleted) colorClass = 'text-green-400 bg-green-900 border-green-500';
        if (isActive) colorClass = 'text-blue-400 bg-blue-900 border-blue-500';

        return (
          <React.Fragment key={phase}>
            <div 
              className={`flex items-center justify-center px-4 py-2 rounded-full border cursor-pointer capitalize font-semibold text-sm ${colorClass}`}
              onClick={() => onPhaseClick?.(phase)}
            >
              {phase}
            </div>
            {index < PHASES.length - 1 && (
              <div className={`flex-1 h-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
