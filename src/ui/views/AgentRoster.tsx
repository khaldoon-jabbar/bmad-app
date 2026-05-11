import React, { useEffect, useState } from 'react';
import { Agent } from '../../shared/types';
import { AgentCard } from '../components/AgentCard';

interface AgentRosterProps {
  callTool: (name: string, args: any) => Promise<any>;
}

export function AgentRoster({ callTool }: AgentRosterProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    callTool('bmad_agents', {}).then(res => {
      if (active && Array.isArray(res)) {
        setAgents(res);
      }
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [callTool]);

  const handleLaunch = (agent: Agent, code: string) => {
    callTool('bmad_orchestrate', { skill: agent.skillId, triggerCode: code });
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading agents...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Agent Roster</h1>
      <p className="text-gray-400 mb-8">Manage specialized agents across all BMad phases.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} onLaunch={(code) => handleLaunch(agent, code)} />
        ))}
      </div>
    </div>
  );
}
