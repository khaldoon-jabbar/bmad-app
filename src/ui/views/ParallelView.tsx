import React, { useEffect, useState } from 'react';
import { ParallelTaskGroup } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';

interface ParallelViewProps {
  callTool: (name: string, args: any) => Promise<any>;
}

export function ParallelView({ callTool }: ParallelViewProps) {
  const [groups, setGroups] = useState<ParallelTaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    callTool('bmad_parallel', { action: 'analyze' }).then(res => {
      if (active && res?.groups) setGroups(res.groups);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [callTool]);

  const handleRunParallel = async (group: ParallelTaskGroup) => {
    setExecuting(true);
    setResult(null);
    try {
      const res = await callTool('bmad_parallel', { action: 'execute', tasks: group.tasks });
      setResult(res?.message || 'Execution complete');
    } catch {
      setResult('Failed to execute parallel tasks');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Analyzing parallelizable tasks...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Parallel Execution</h1>
      <p className="text-gray-400 mb-8">Run independent tasks simultaneously for faster delivery.</p>

      {groups.length === 0 ? (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-gray-400">
          No parallelizable task groups found. Tasks must be independent (no shared dependencies) to run in parallel.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold">{group.reason}</h2>
                  <span className="text-sm text-gray-400">{group.tasks.length} task(s)</span>
                </div>
                <ActionButton onClick={() => handleRunParallel(group)} loading={executing} disabled={!group.canRunInParallel}>
                  Run Parallel
                </ActionButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.tasks.map((task, i) => (
                  <span key={i} className="inline-flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-600">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {task.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-green-700 text-green-300">
          {result}
        </div>
      )}
    </div>
  );
}
