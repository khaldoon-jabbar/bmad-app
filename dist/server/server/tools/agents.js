import { getDashboardState } from './dashboard.js';
const AGENTS = [
    {
        id: 'mary',
        name: 'Mary',
        emoji: '📊',
        role: 'Analyst',
        skillId: 'bmad-analyst',
        phase: 'analysis',
        triggerCodes: [
            { code: 'AB', label: 'Analyze Brief', description: 'Analyze project brief and create research summary' },
            { code: 'AP', label: 'Analyze PRFAQ', description: 'Create PR/FAQ document' },
        ],
    },
    {
        id: 'paige',
        name: 'Paige',
        emoji: '📚',
        role: 'Tech Writer',
        skillId: 'bmad-tech-writer',
        phase: 'analysis',
        triggerCodes: [
            { code: 'DP', label: 'Document Project', description: 'Full project documentation pass' },
            { code: 'WD', label: 'Write Document', description: 'Generate a specific document' },
            { code: 'VD', label: 'Validate Doc', description: 'Check document for completeness' },
        ],
    },
    {
        id: 'john',
        name: 'John',
        emoji: '📋',
        role: 'Product Manager',
        skillId: 'bmad-pm',
        phase: 'planning',
        triggerCodes: [
            { code: 'CP', label: 'Create PRD', description: 'Create Product Requirements Document' },
            { code: 'CE', label: 'Create Epics', description: 'Create epics and stories from PRD' },
        ],
    },
    {
        id: 'sally',
        name: 'Sally',
        emoji: '🎨',
        role: 'UX Designer',
        skillId: 'bmad-ux-designer',
        phase: 'planning',
        triggerCodes: [
            { code: 'CU', label: 'Create UX Spec', description: 'Create UX specification document' },
        ],
    },
    {
        id: 'winston',
        name: 'Winston',
        emoji: '🏗️',
        role: 'Architect',
        skillId: 'bmad-architect',
        phase: 'solutioning',
        triggerCodes: [
            { code: 'CA', label: 'Create Architecture', description: 'Create architecture document' },
        ],
    },
    {
        id: 'amelia',
        name: 'Amelia',
        emoji: '💻',
        role: 'Developer',
        skillId: 'bmad-agent-dev',
        phase: 'implementation',
        triggerCodes: [
            { code: 'SP', label: 'Sprint Planning', description: 'Plan and start a sprint' },
            { code: 'DS', label: 'Dev Story', description: 'Develop a story (write code)' },
            { code: 'CR', label: 'Code Review', description: 'Review code for a story' },
        ],
    },
];
export async function handleAgents(projectPath) {
    const state = await getDashboardState(projectPath);
    return AGENTS.map((agent) => {
        let outputsExist = false;
        switch (agent.id) {
            case 'mary':
                outputsExist = state.documents.projectContext;
                break;
            case 'paige':
                outputsExist = state.documents.projectContext;
                break;
            case 'john':
                outputsExist = state.documents.prd;
                break;
            case 'sally':
                outputsExist = state.documents.uxSpec;
                break;
            case 'winston':
                outputsExist = state.documents.architecture;
                break;
            case 'amelia':
                outputsExist = state.sprint !== null;
                break;
        }
        return { ...agent, outputsExist };
    });
}
