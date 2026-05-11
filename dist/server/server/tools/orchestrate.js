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
export async function handleOrchestrate(input, projectPath) {
    const state = await getDashboardState(projectPath);
    const gateResult = checkPhaseGate(input.triggerCode, state);
    if (!gateResult.allowed) {
        return { status: 'blocked', message: gateResult.message, gateResult };
    }
    return {
        status: 'triggered',
        message: `Triggering ${input.skill} with code ${input.triggerCode}`,
        gateResult,
    };
}
