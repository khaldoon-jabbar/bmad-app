import React from 'react';
import { ProjectState, ViewId } from '../../shared/types';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ActionButton } from '../components/ActionButton';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface EpicDetailProps {
  epicId: string;
  projectState: ProjectState | null;
  navigate: (view: ViewId, params?: Record<string, string>) => void;
}

export function EpicDetail({ epicId, projectState, navigate }: EpicDetailProps) {
  const epic = projectState?.epics.find(e => e.id === epicId);

  if (!epic) return <div className="p-6 text-red-500">Epic not found</div>;

  const doneCount = epic.stories.filter(s => s.status === 'done').length;
  const progress = epic.stories.length ? (doneCount / epic.stories.length) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{epic.title}</h1>
            <StatusBadge status={epic.status} />
          </div>
          <span className="text-gray-400 font-mono text-sm">{epic.id}</span>
        </div>
        <div className="flex gap-2">
          <ActionButton onClick={() => navigate('story-detail', { epicId: epic.id })}>Create Next Story</ActionButton>
          <ActionButton variant="secondary">Run Retrospective</ActionButton>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-700">
        <h3 className="text-sm text-gray-400 mb-2">Progress: {doneCount}/{epic.stories.length} Stories Done</h3>
        <ProgressBar progress={progress} status={progress === 100 ? 'done' : 'active'} />
      </div>

      <div className="mb-8 prose prose-invert max-w-none bg-gray-800 p-6 rounded-lg border border-gray-700">
        <Markdown remarkPlugins={[remarkGfm]}>{epic.description || '*No description provided.*'}</Markdown>
      </div>

      <h2 className="text-xl font-bold mb-4">Stories</h2>
      <div className="flex flex-col gap-3">
        {epic.stories.map(story => (
          <div 
            key={story.slug} 
            className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-500"
            onClick={() => navigate('story-detail', { slug: story.slug })}
          >
            <div className="flex flex-col">
              <span className="font-semibold">{story.title || story.slug}</span>
              <span className="text-sm text-gray-400 font-mono">{story.slug}</span>
            </div>
            <StatusBadge status={story.status} />
          </div>
        ))}
        {epic.stories.length === 0 && <div className="text-gray-500 italic">No stories yet.</div>}
      </div>
    </div>
  );
}
