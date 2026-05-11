import { getDashboardState } from './dashboard.js';
export async function handleParallel(input, projectPath) {
    const state = await getDashboardState(projectPath);
    const { action, tasks, maxConcurrency = 2 } = input;
    if (action === 'analyze') {
        const groups = [];
        if (state.sprint) {
            for (const epic of state.sprint.epics) {
                const unstarted = epic.stories.filter(s => s.status === 'draft');
                const independent = unstarted.filter(s => s.dependencies.length === 0);
                if (independent.length >= 2) {
                    groups.push({
                        id: `parallel-${epic.id}`,
                        tasks: independent.slice(0, maxConcurrency).map(s => ({
                            skill: 'bmad-agent-dev',
                            triggerCode: 'DS',
                            context: { storySlug: s.slug, epicId: epic.id },
                            label: s.title,
                        })),
                        canRunInParallel: true,
                        reason: `${independent.length} independent stories in ${epic.title}`,
                    });
                }
            }
        }
        return { groups, message: `Found ${groups.length} parallelizable group(s)` };
    }
    if (tasks && tasks.length > 0) {
        const group = {
            id: 'user-parallel',
            tasks: tasks.slice(0, maxConcurrency),
            canRunInParallel: true,
            reason: 'User-initiated parallel execution',
        };
        return { groups: [group], message: `Executing ${group.tasks.length} task(s) in parallel` };
    }
    return { groups: [], message: 'No tasks provided' };
}
