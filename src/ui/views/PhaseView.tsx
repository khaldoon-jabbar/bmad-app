import React from 'react';
import { Phase, ProjectState } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';

interface PhaseViewProps {
  phase: Phase;
  projectState: ProjectState | null;
}

export function PhaseView({ phase, projectState }: PhaseViewProps) {
  const docs = projectState?.documents || { prd: false, architecture: false, uxSpec: false, projectContext: false };

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
            <ActionButton variant="primary">Generate PRD</ActionButton>
            <ActionButton variant="secondary">Run Architecture Analysis</ActionButton>
            <ActionButton variant="secondary">Proceed to Next Phase</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
