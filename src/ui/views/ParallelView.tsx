import React, { useEffect, useState } from 'react';
import { ParallelTaskGroup, ParallelTask } from '../../shared/types';
import { ActionButton } from '../components/ActionButton';
import { ProgressBar } from '../components/ProgressBar';

interface ParallelViewProps {
  callTool: (name: string, args: any) => Promise<any>;
}

type TaskStatus = 'pending' | 'running' | 'done' | 'failed';

interface TaskProgress {
  task: ParallelTask;
  status: TaskStatus;
}

export function ParallelView({ callTool }: ParallelViewProps) {
  const [groups, setGroups] = useState<ParallelTaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [taskProgress, setTaskProgress] = useState<TaskProgress[]>([]);

  useEffect(() => {
    let active = true;
    callTool('bmad_parallel', { action: 'analyze' }).then(res => {
      if (active && res?.groups) setGroups(res.groups);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [callTool]);

  const handleRunParallel = async (group: ParallelTaskGroup) => {
    setExecuting(true);
    const progress: TaskProgress[] = group.tasks.map(t => ({ task: t, status: 'running' as TaskStatus }));
    setTaskProgress(progress);

    try {
      const res = await callTool('bmad_parallel', { action: 'execute', tasks: group.tasks });
      setTaskProgress(prev => prev.map(tp => ({ ...tp, status: 'done' as TaskStatus })));
    } catch {
      setTaskProgress(prev => prev.map(tp => ({ ...tp, status: 'failed' as TaskStatus })));
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Analyzing parallelizable tasks...</div>;

  const completedCount = taskProgress.filter(tp => tp.status === 'done').length;
  const totalCount = taskProgress.length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Parallel Execution</h1>
      <p className="text-gray-400 mb-8">Run independent tasks simultaneously for faster delivery.</p>

      {groups.length === 0 && taskProgress.length === 0 ? (
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

      {taskProgress.length > 0 && (
        <div className="mt-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Execution Progress</h2>
            <span className="text-sm text-gray-400">{completedCount}/{totalCount} complete</span>
          </div>
          <ProgressBar progress={overallProgress} status={overallProgress === 100 ? 'done' : 'active'} />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {taskProgress.map((tp, i) => {
              const statusColor = tp.status === 'done' ? 'bg-green-500' : tp.status === 'running' ? 'bg-amber-500 animate-pulse' : tp.status === 'failed' ? 'bg-red-500' : 'bg-gray-500';
              return (
                <div key={i} className="flex items-center gap-3 bg-gray-750 p-3 rounded border border-gray-600">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColor}`}></span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-200 truncate block">{tp.task.label}</span>
                    <span className="text-xs text-gray-500">{tp.task.skill} / {tp.task.triggerCode}</span>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{tp.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
