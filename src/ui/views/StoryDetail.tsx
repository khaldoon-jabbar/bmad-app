import React from 'react';
import { ProjectState, ViewId } from '../../shared/types';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StoryDetailProps {
  slug: string;
  projectState: ProjectState | null;
  navigate: (view: ViewId, params?: Record<string, string>) => void;
}

export function StoryDetail({ slug, projectState, navigate }: StoryDetailProps) {
  const story = projectState?.epics.flatMap(e => e.stories).find(s => s.slug === slug);

  if (!story) return <div className="p-6 text-red-500">Story not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{story.title || story.slug}</h1>
            <StatusBadge status={story.status} />
          </div>
          <span className="text-gray-400 font-mono text-sm cursor-pointer hover:underline" onClick={() => navigate('epic-detail', { id: story.epicId })}>
            {story.epicId}
          </span>
        </div>
        <div className="flex gap-2">
          {story.status === 'draft' && <ActionButton>Start Story</ActionButton>}
          {story.status === 'in-progress' && <ActionButton>Code Review</ActionButton>}
          <ActionButton variant="secondary">Dev Story</ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 prose prose-invert max-w-none bg-gray-800 p-6 rounded-lg border border-gray-700">
          <Markdown remarkPlugins={[remarkGfm]}>{story.content || '*No content provided.*'}</Markdown>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold mb-4">Acceptance Criteria</h2>
            <div className="flex flex-col gap-2">
              {story.acceptanceCriteria.map(ac => (
                <div key={ac.id} className="flex items-start gap-2">
                  <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-sm border ${ac.completed ? 'bg-green-500 border-green-500' : 'bg-gray-700 border-gray-500'}`}>
                    {ac.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  <span className={`text-sm ${ac.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{ac.description}</span>
                </div>
              ))}
              {story.acceptanceCriteria.length === 0 && <span className="text-gray-500 text-sm italic">No ACs defined.</span>}
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold mb-2">Dependencies</h2>
            <div className="flex flex-wrap gap-2">
              {story.dependencies.map(dep => (
                <span key={dep} className="text-xs bg-gray-700 px-2 py-1 rounded border border-gray-600 font-mono text-gray-300">{dep}</span>
              ))}
              {story.dependencies.length === 0 && <span className="text-gray-500 text-sm italic">None</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
