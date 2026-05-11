import { getDashboardState } from './dashboard.js';
const GATE_RULES = {
    CA: {
        requires: [(s) => s.documents.prd],
        messages: ['PRD.md must exist before creating architecture'],
    },
    CE: {
        requires: [(s) => s.documents.prd, (s) => s.documents.architecture],
        messages: ['PRD.md is required', 'architecture.md is required'],
    },
    SP: {
        requires: [(s) => s.epics.length > 0],
        messages: ['Epics with stories must exist before sprint planning'],
    },
    DS: {
        requires: [(s) => s.sprint !== null],
        messages: ['An active sprint is required before developing stories'],
    },
    CR: {
        requires: [(s) => s.sprint !== null],
        messages: ['An active sprint is required before code review'],
    },
};
function checkPhaseGate(triggerCode, state) {
    const rule = GATE_RULES[triggerCode];
    if (!rule)
        return { allowed: true, missingPrerequisites: [], message: 'No gate restrictions' };
    const missing = [];
    for (let i = 0; i < rule.requires.length; i++) {
        if (!rule.requires[i](state)) {
            missing.push(rule.messages[i]);
        }
    }
    if (missing.length > 0) {
        return { allowed: false, missingPrerequisites: missing, message: `Blocked: ${missing.join(', ')}` };
    }
    return { allowed: true, missingPrerequisites: [], message: 'All prerequisites met' };
}
const SKILL_PROMPTS = {
    'bmad-pm': 'You are the BMad PM agent. Analyze the current project status including sprint progress, epic completion, story statuses, and any blockers. Provide a concise status report with actionable next steps.',
    'bmad-arch': 'You are the BMad Architect agent. Review the current architecture decisions, identify technical debt, evaluate design patterns in use, and suggest improvements. Focus on maintainability, scalability, and alignment with the PRD.',
    'bmad-dev': 'You are the BMad Developer agent. Check implementation status across active stories, assess code quality patterns, identify incomplete work, and report on development velocity and any technical blockers.',
    'bmad-help': 'You are the BMad Help agent. Answer the user\'s question about the BMad Method clearly and concisely, referencing relevant phases, artifacts, and best practices.',
    'initialize-bmad': 'You are the BMad Initialization agent. Set up a new BMad project structure. Create the initial epic and story hierarchy, establish sprint cadence, and ensure all required project documents (PRD, architecture) are scaffolded.',
};
function getSkillPrompt(skill, triggerCode, context, preferredModel) {
    const basePrompt = SKILL_PROMPTS[skill] || `Execute BMad skill "${skill}" following the BMad Method workflow.`;
    const contextStr = context
        ? Object.entries(context).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';
    const parts = [basePrompt];
    if (triggerCode)
        parts.push(`Trigger code: ${triggerCode}.`);
    if (contextStr)
        parts.push(`Context: ${contextStr}.`);
    if (preferredModel)
        parts.push(`Preferred model: ${preferredModel}.`);
    return parts.join(' ');
}
export async function handleOrchestrate(input, projectPath, sampling) {
    const state = await getDashboardState(projectPath);
    const gateResult = checkPhaseGate(input.triggerCode, state);
    if (!gateResult.allowed) {
        return { status: 'blocked', message: gateResult.message, gateResult };
    }
    if (sampling) {
        try {
            const prompt = getSkillPrompt(input.skill, input.triggerCode, input.context, input.preferredModel);
            const samplingResult = await sampling.createMessage({
                messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
                maxTokens: 4096,
            });
            const responseText = samplingResult?.content?.[0]?.text || samplingResult?.content || 'Skill executed via sampling.';
            return {
                status: 'triggered',
                message: typeof responseText === 'string' ? responseText : JSON.stringify(responseText),
                gateResult,
            };
        }
        catch {
            // Fall through to basic trigger if sampling fails
        }
    }
    return {
        status: 'triggered',
        message: `Triggering ${input.skill} with code ${input.triggerCode}`,
        gateResult,
    };
}
