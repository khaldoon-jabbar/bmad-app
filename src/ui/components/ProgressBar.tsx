import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: 'done' | 'active' | 'warning';
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  const color = status === 'done' ? 'bg-green-600' : status === 'warning' ? 'bg-yellow-600' : 'bg-blue-600';
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}></div>
    </div>
  );
}
