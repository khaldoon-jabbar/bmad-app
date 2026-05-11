import React from 'react';
import { ProjectState, ViewId } from '../../shared/types';
import { PhaseIndicator } from '../components/PhaseIndicator';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import { ModelPicker } from '../components/ModelPicker';

interface DashboardProps {
  projectState: ProjectState | null;
  navigate: (view: ViewId, params?: Record<string, string>) => void;
  callTool: (name: string, args: any) => Promise<any>;
  triggerSkill: (skill: string, triggerCode: string, extraContext?: Record<string, string>) => void;
}

const mockState: ProjectState = {
  initialized: true,
  track: 'bmad',
  phase: 'analysis',
  documents: { prd: true, architecture: false, uxSpec: false, projectContext: true },
  epics: [
    { id: 'E-1', title: 'User Auth', status: 'in-progress', description: '', stories: [{slug: '1', title: '', status: 'done', epicId: 'E-1', acceptanceCriteria: [], dependencies: [], content: ''}, {slug: '2', title: '', status: 'draft', epicId: 'E-1', acceptanceCriteria: [], dependencies: [], content: ''}] }
  ],
  sprint: { number: 1, status: 'active', started: '2024-01-01', epics: [] },
  config: { projectName: 'Mock Project', track: 'bmad', createdAt: '2024-01-01' },
  recentActions: [],
};

export function Dashboard({ projectState, navigate, callTool, triggerSkill }: DashboardProps) {
  const state = projectState || mockState;

  const triggerWithModel = (skill: string, triggerCode: string) => {
    const model = localStorage.getItem('bmad-preferred-model') || 'Default';
    const extra: Record<string, string> = {};
    if (model !== 'Default') extra.preferredModel = model;
    triggerSkill(skill, triggerCode, extra);
  };

  const getNextAction = () => {
    if (!state.documents.prd) return { label: 'Create PRD', skill: '/bmad-product-brief', code: 'PB' };
    if (!state.documents.architecture) return { label: 'Define Architecture', skill: '/bmad-arch', code: 'CA' };
    if (!state.documents.uxSpec) return { label: 'Create UX Design', skill: '/bmad-ux', code: 'UX' };
    if (state.epics.length === 0) return { label: 'Create Story', skill: '/bmad-story', code: 'CS' };
    if (!state.sprint || state.sprint.status !== 'active') return { label: 'Plan Sprint', skill: '/bmad-sprint-plan', code: 'SP' };
    return { label: 'Start Dev Story', skill: '/bmad-dev-story', code: 'DS' };
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
          <ActionButton onClick={() => triggerSkill(nextAction.skill, nextAction.code)} className="w-full text-lg py-3">{nextAction.label}</ActionButton>
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
        <h2 className="text-xl font-bold mb-4 text-gray-100">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-product-brief', 'PB')}>Create PRD</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-arch', 'CA')}>Define Architecture</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-ux', 'UX')}>Create UX Design</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-sprint-plan', 'SP')}>Plan Sprint</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-story', 'CS')}>Create Story</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-dev-story', 'DS')}>Start Dev Story</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-quick-dev', 'QD')}>Quick Dev</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-tech-writer', 'TW')}>Generate Docs</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-retro', 'RT')}>Run Retrospective</ActionButton>
          <div className="col-span-2 md:col-span-4 flex items-center gap-3 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-400">Review Model:</span>
            <ModelPicker />
          </div>
          <ActionButton variant="secondary" onClick={() => triggerWithModel('/bmad-gate-check', 'GC')}>Validate Phase Gate</ActionButton>
          <ActionButton variant="secondary" onClick={() => triggerWithModel('/bmad-code-review', 'CR')}>Code Review</ActionButton>
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
          {(state.recentActions || []).slice(0, 5).map((action, i) => (
            <div key={action.id + i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-blue-400 text-sm font-medium">{action.action}</span>
                <span className="text-gray-200 text-sm">{action.target}</span>
              </div>
              <span className="text-gray-500 text-xs">{new Date(action.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
          {(!state.recentActions || state.recentActions.length === 0) && (
            <div className="px-4 py-3 text-gray-500 text-sm">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}
