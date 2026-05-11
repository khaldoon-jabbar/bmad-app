import React from 'react';
import { StoryStatus, EpicStatus } from '../../shared/types';

interface StatusBadgeProps {
  status: StoryStatus | EpicStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let color = 'bg-gray-700 text-gray-400 border-gray-600';
  if (status === 'in-progress') color = 'bg-blue-600 text-blue-400 border-blue-500';
  if (status === 'review') color = 'bg-yellow-600 text-yellow-400 border-yellow-500';
  if (status === 'done') color = 'bg-green-600 text-green-400 border-green-500';
  if (status === 'blocked') color = 'bg-red-600 text-red-400 border-red-500';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs border font-medium uppercase ${color}`}>
      {status}
    </span>
  );
}
