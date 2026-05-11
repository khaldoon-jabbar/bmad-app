import React, { useState } from 'react';
import { ProjectState, StoryStatus, Story, ViewId } from '../../shared/types';
import { ProgressBar } from '../components/ProgressBar';
import { ActionButton } from '../components/ActionButton';

interface SprintBoardProps {
  projectState: ProjectState | null;
  navigate: (view: ViewId, params?: Record<string, string>) => void;
}

const COLUMNS: { id: StoryStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' }
];

export function SprintBoard({ projectState, navigate }: SprintBoardProps) {
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const epics = projectState?.epics || [];
  const stories = epics.flatMap(e => e.stories);
  const filteredStories = selectedEpic ? stories.filter(s => s.epicId === selectedEpic) : stories;

  const doneCount = filteredStories.filter(s => s.status === 'done').length;
  const progress = filteredStories.length ? (doneCount / filteredStories.length) * 100 : 0;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sprint Board</h1>
        <div className="w-64">
          <ProgressBar progress={progress} status={progress === 100 ? 'done' : 'active'} />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <ActionButton 
          variant={selectedEpic === null ? 'primary' : 'secondary'} 
          onClick={() => setSelectedEpic(null)}
          className="text-xs py-1"
        >
          All Epics
        </ActionButton>
        {epics.map(epic => (
          <ActionButton 
            key={epic.id}
            variant={selectedEpic === epic.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedEpic(epic.id)}
            className="text-xs py-1"
          >
            {epic.title}
          </ActionButton>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 overflow-y-auto">
        {COLUMNS.map(col => (
          <div key={col.id} className="bg-gray-800 rounded-lg p-3 flex flex-col gap-3 min-h-[500px]">
            <h2 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">{col.label} ({filteredStories.filter(s => s.status === col.id).length})</h2>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {filteredStories.filter(s => s.status === col.id).map(story => (
                <div 
                  key={story.slug} 
                  className="bg-gray-700 p-3 rounded border border-gray-600 cursor-pointer hover:border-blue-500"
                  onClick={() => navigate('story-detail', { slug: story.slug })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-xs text-gray-400">{story.epicId}</span>
                  </div>
                  <h3 className="text-sm font-medium leading-tight mb-2 text-gray-100">{story.title || story.slug}</h3>
                  <div className="text-xs text-gray-400">
                    AC: {story.acceptanceCriteria.filter(ac => ac.completed).length}/{story.acceptanceCriteria.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
