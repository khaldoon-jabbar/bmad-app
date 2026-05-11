import type { OrchestrateInput, OrchestrateOutput, PhaseGateResult, ProjectState } from '../../shared/types.js';
import { getDashboardState } from './dashboard.js';
import { contextManager, type WorkflowId } from '../context-manager.js';

interface GateRule {
  requires: Array<(state: ProjectState) => boolean>;
  messages: string[];
}

const GATE_RULES: Record<string, GateRule> = {
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

function checkPhaseGate(triggerCode: string, state: ProjectState): PhaseGateResult {
  const rule = GATE_RULES[triggerCode];
  if (!rule) return { allowed: true, missingPrerequisites: [], message: 'No gate restrictions' };

  const missing: string[] = [];
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

const SKILL_TO_WORKFLOW: Record<string, WorkflowId> = {
  'bmad-pm': 'pm',
  'bmad-arch': 'arch',
  'bmad-architect': 'arch',
  'bmad-dev': 'dev',
  'bmad-dev-story': 'dev',
  'bmad-agent-dev': 'dev',
  'bmad-quick-dev': 'dev',
  'bmad-story': 'pm',
  'bmad-sprint-plan': 'pm',
  'bmad-retro': 'pm',
  'bmad-ux': 'pm',
  'bmad-help': 'help',
  'bmad-product-brief': 'init',
  'initialize-bmad': 'init',
};

const SKILL_PROMPTS: Record<string, string> = {
  'bmad-pm': '/bmad-pm',
  'bmad-arch': '/bmad-arch',
  'bmad-architect': '/bmad-arch',
  'bmad-dev': '/bmad-dev',
  'bmad-dev-story': '/bmad-dev-story',
  'bmad-agent-dev': '/bmad-agent-dev',
  'bmad-story': '/bmad-story',
  'bmad-sprint-plan': '/bmad-sprint-plan',
  'bmad-retro': '/bmad-retro',
  'bmad-ux': '/bmad-ux',
  'bmad-quick-dev': '/bmad-quick-dev',
  'bmad-help': '/bmad-help',
  'bmad-product-brief': '/bmad-product-brief',
  'initialize-bmad': '/bmad-product-brief',
  'bmad-code-review': '/bmad-code-review',
  'bmad-tech-writer': '/bmad-tech-writer',
  'bmad-gate-check': '/bmad-gate-check',
};

function normalizeSkill(skill: string): string {
  return skill.replace(/^\//, '');
}

function getSkillPrompt(skill: string, _triggerCode: string, context?: Record<string, string | undefined>, _preferredModel?: string): string {
  const normalized = normalizeSkill(skill);
  const cmd = SKILL_PROMPTS[normalized] || `/${normalized}`;
  const contextStr = context
    ? Object.entries(context).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '';
  return contextStr ? `${cmd} ${contextStr}` : cmd;
}

export async function handleOrchestrate(
  input: OrchestrateInput,
  projectPath: string,
  sampling?: { createMessage: (params: any) => Promise<any> },
): Promise<OrchestrateOutput> {
  const state = await getDashboardState(projectPath);
  const gateResult = checkPhaseGate(input.triggerCode, state);

  if (!gateResult.allowed) {
    return { status: 'blocked', message: gateResult.message, gateResult };
  }

  if (sampling) {
    try {
      const prompt = getSkillPrompt(input.skill, input.triggerCode, input.context, input.preferredModel);
      const normalized = normalizeSkill(input.skill);
      const workflowId = SKILL_TO_WORKFLOW[normalized] || 'dev';

      const responseText = await contextManager.sample(
        workflowId,
        prompt,
        sampling.createMessage,
      );

      return {
        status: 'triggered',
        message: responseText,
        gateResult,
      };
    } catch {
      // Fall through to basic trigger if sampling fails
    }
  }

  return {
    status: 'triggered',
    message: `Triggering ${input.skill} with code ${input.triggerCode}`,
    gateResult,
  };
}
