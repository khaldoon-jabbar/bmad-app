import React from 'react';
import { ProjectState, ViewId } from '../../shared/types';
import { PhaseIndicator } from '../components/PhaseIndicator';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';

interface DashboardProps {
  projectState: ProjectState | null;
  navigate: (view: ViewId, params?: Record<string, string>) => void;
}

const mockState: ProjectState = {
  track: 'bmad',
  phase: 'analysis',
  documents: { prd: true, architecture: false, uxSpec: false, projectContext: true },
  epics: [
    { id: 'E-1', title: 'User Auth', status: 'in-progress', description: '', stories: [{slug: '1', title: '', status: 'done', epicId: 'E-1', acceptanceCriteria: [], dependencies: [], content: ''}, {slug: '2', title: '', status: 'draft', epicId: 'E-1', acceptanceCriteria: [], dependencies: [], content: ''}] }
  ],
  sprint: { number: 1, status: 'active', started: '2024-01-01', epics: [] },
  config: { projectName: 'Mock Project', track: 'bmad', createdAt: '2024-01-01' }
};

export function Dashboard({ projectState, navigate }: DashboardProps) {
  const state = projectState || mockState;
  
  const getNextAction = () => {
    if (!state.documents.prd) return { label: 'Create PRD', action: () => navigate('docs') };
    if (!state.documents.architecture) return { label: 'Create Architecture', action: () => navigate('docs') };
    if (state.epics.length === 0) return { label: 'Create Epics', action: () => navigate('sprint-board') };
    if (!state.sprint || state.sprint.status !== 'active') return { label: 'Start Sprint', action: () => navigate('sprint-board') };
    return { label: 'Pick Next Story', action: () => navigate('sprint-board') };
  };

  const nextAction = getNextAction();

  const totalStories = state.epics.flatMap(e => e.stories).length;
  const doneStories = state.epics.flatMap(e => e.stories).filter(s => s.status === 'done').length;
  const sprintProgress = totalStories ? (doneStories / totalStories) * 100 : 0;

  return (
    <div className="p-6 flex flex-col gap-6">
      <PhaseIndicator currentPhase={state.phase} onPhaseClick={(p) => navigate('phase', { phase: p })} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-2">{state.config?.projectName || 'Unnamed Project'}</h2>
          <div className="text-gray-400 text-sm mb-4">Track: <span className="uppercase text-gray-300">{state.track}</span></div>
          <ActionButton onClick={nextAction.action} className="w-full text-lg py-3">{nextAction.label}</ActionButton>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-bold mb-4">Sprint Progress</h2>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Sprint {state.sprint?.number || 0} ({state.sprint?.status || 'inactive'})</span>
            <span>{doneStories}/{totalStories} stories done</span>
          </div>
          <ProgressBar progress={sprintProgress} status={sprintProgress === 100 ? 'done' : 'active'} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-100">Epics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {state.epics.map(epic => {
            const done = epic.stories.filter(s => s.status === 'done').length;
            const progress = epic.stories.length ? (done / epic.stories.length) * 100 : 0;
            return (
              <div key={epic.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-500 transition-colors" onClick={() => navigate('epic-detail', { id: epic.id })}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{epic.title}</h3>
                  <StatusBadge status={epic.status} />
                </div>
                <div className="text-sm text-gray-400 mb-3">{epic.stories.length} stories</div>
                <ProgressBar progress={progress} status={progress === 100 ? 'done' : 'active'} />
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-100">Recent Activity</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
          {state.epics.flatMap(e => e.stories).slice(0, 5).map((story, i) => (
            <div key={story.slug || i} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-750" onClick={() => navigate('story-detail', { slug: story.slug })}>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs font-mono">{story.epicId}</span>
                <span className="text-gray-200 text-sm">{story.title || story.slug}</span>
              </div>
              <StatusBadge status={story.status} />
            </div>
          ))}
          {state.epics.flatMap(e => e.stories).length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}
