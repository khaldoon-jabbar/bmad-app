import React from 'react';
import { Phase, ProjectState } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';
import { ModelPicker } from '../components/ModelPicker';

interface PhaseViewProps {
  phase: Phase;
  projectState: ProjectState | null;
  callTool: (name: string, args: any) => Promise<any>;
}

export function PhaseView({ phase, projectState, callTool }: PhaseViewProps) {
  const docs = projectState?.documents || { prd: false, architecture: false, uxSpec: false, projectContext: false };

  const triggerSkill = (skill: string, triggerCode: string) => {
    callTool('bmad_orchestrate', { skill, triggerCode });
  };

  const triggerWithModel = (skill: string, triggerCode: string) => {
    const model = localStorage.getItem('bmad-preferred-model') || 'Default';
    const args: any = { skill, triggerCode };
    if (model !== 'Default') args.preferredModel = model;
    callTool('bmad_orchestrate', args);
  };

  const renderStatus = (exists: boolean) => (
    exists ? <span className="text-green-500">✓ Done</span> : <span className="text-gray-500">Pending</span>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold capitalize mb-4">{phase} Phase</h1>
      <p className="text-gray-400 mb-6">Manage deliverables and orchestration for this phase.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-bold mb-4">Documents</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>PRD</span>{renderStatus(docs.prd)}
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>Architecture</span>{renderStatus(docs.architecture)}
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span>UX Spec</span>{renderStatus(docs.uxSpec)}
            </div>
            <div className="flex justify-between">
              <span>Project Context</span>{renderStatus(docs.projectContext)}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-bold mb-4">Phase Actions</h2>
          <div className="flex flex-col gap-3">
            <ActionButton variant="primary" onClick={() => triggerSkill('/bmad-product-brief', 'PB')}>Generate PRD</ActionButton>
            <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-arch', 'CA')}>Run Architecture Analysis</ActionButton>
            <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-ux', 'UX')}>Create UX Design</ActionButton>
            <ActionButton variant="secondary" onClick={() => triggerSkill('/bmad-sprint-plan', 'SP')}>Plan Sprint</ActionButton>
            <div className="flex items-center gap-2 mt-2">
              <ActionButton variant="secondary" onClick={() => triggerWithModel('/bmad-gate-check', 'GC')}>Validate Phase Gate</ActionButton>
              <ModelPicker />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
