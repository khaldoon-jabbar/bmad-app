import React from 'react';
import { Agent } from '../../shared/types';
import { AgentCard } from '../components/AgentCard';

const MOCK_AGENTS: Agent[] = [
  { id: 'mary', name: 'Mary', emoji: '📊', role: 'Analyst', skillId: 'analyst', phase: 'analysis', triggerCodes: [{ code: 'analyze', label: 'Analyze', description: 'Run analysis' }], outputsExist: true },
  { id: 'paige', name: 'Paige', emoji: '📚', role: 'Tech Writer', skillId: 'writer', phase: 'planning', triggerCodes: [{ code: 'write-prd', label: 'PRD', description: 'Write PRD' }], outputsExist: false },
  { id: 'john', name: 'John', emoji: '📋', role: 'PM', skillId: 'pm', phase: 'planning', triggerCodes: [{ code: 'plan-sprint', label: 'Plan', description: 'Plan sprint' }], outputsExist: true },
  { id: 'sally', name: 'Sally', emoji: '🎨', role: 'UX', skillId: 'ux', phase: 'solutioning', triggerCodes: [{ code: 'design', label: 'Design', description: 'Create UX' }], outputsExist: false },
  { id: 'winston', name: 'Winston', emoji: '🏗️', role: 'Architect', skillId: 'architect', phase: 'solutioning', triggerCodes: [{ code: 'arch', label: 'Architecture', description: 'Write Arch' }], outputsExist: true },
  { id: 'amelia', name: 'Amelia', emoji: '💻', role: 'Developer', skillId: 'dev', phase: 'implementation', triggerCodes: [{ code: 'dev', label: 'Develop', description: 'Write code' }], outputsExist: false },
];

interface AgentRosterProps {
  callTool: (name: string, args: any) => Promise<any>;
}

export function AgentRoster({ callTool }: AgentRosterProps) {
  const handleLaunch = (code: string) => {
    callTool('bmad_orchestrate', { skill: 'agent', triggerCode: code });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Agent Roster</h1>
      <p className="text-gray-400 mb-8">Manage specialized agents across all BMad phases.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} onLaunch={handleLaunch} />
        ))}
      </div>
    </div>
  );
}
