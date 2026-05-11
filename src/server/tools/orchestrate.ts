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
  'bmad-pm': 'You are the BMad PM agent. Analyze the current project status including sprint progress, epic completion, story statuses, and any blockers. Provide a concise status report with actionable next steps.',
  'bmad-arch': 'You are the BMad Architect agent. Review the current architecture decisions, identify technical debt, evaluate design patterns in use, and suggest improvements. Focus on maintainability, scalability, and alignment with the PRD.',
  'bmad-architect': 'You are the BMad Architect agent. Review the current architecture decisions, identify technical debt, evaluate design patterns in use, and suggest improvements. Focus on maintainability, scalability, and alignment with the PRD.',
  'bmad-dev': 'You are the BMad Developer agent. Check implementation status across active stories, assess code quality patterns, identify incomplete work, and report on development velocity and any technical blockers.',
  'bmad-dev-story': 'You are the BMad Developer agent working on a specific story. Implement the story according to its acceptance criteria. Write the code, tests, and mark criteria as complete. Output the implementation plan and any files changed.',
  'bmad-agent-dev': 'You are the BMad Developer agent. Check implementation status across active stories, assess code quality patterns, identify incomplete work, and report on development velocity and any technical blockers.',
  'bmad-story': 'You are the BMad PM agent creating a new user story. Based on the project PRD, architecture, and existing epics, generate a complete story artifact. Infer the actor, need, and value from the project context. Output: Story ID, User Story (As a... I want... so that...), Context & Scope, Acceptance Criteria (Given/When/Then format), Technical Notes, and Definition of Done. Do NOT ask the user for input — generate the story directly from available project context.',
  'bmad-sprint-plan': 'You are the BMad PM agent creating a sprint plan. Based on the current epics, stories, and their statuses, create a sprint plan that prioritizes the most impactful work. Output the sprint goal, selected stories, capacity allocation, and timeline.',
  'bmad-retro': 'You are the BMad PM agent running a retrospective. Analyze the current sprint progress, completed stories, and blockers. Output: What went well, What could improve, Action items for next sprint.',
  'bmad-ux': 'You are the BMad UX Designer agent. Based on the PRD and architecture, create UX specifications including user flows, wireframe descriptions, interaction patterns, and accessibility requirements.',
  'bmad-quick-dev': 'You are the BMad Quick Dev agent. Execute the given intent rapidly — write the code, make the change, fix the bug. Be direct and output the result immediately without asking clarifying questions.',
  'bmad-help': 'You are the BMad Help agent. Answer the user\'s question about the BMad Method clearly and concisely, referencing relevant phases, artifacts, and best practices.',
  'bmad-product-brief': 'You are the BMad Initialization agent. Set up a new BMad project structure. Create the initial epic and story hierarchy, establish sprint cadence, and ensure all required project documents (PRD, architecture) are scaffolded.',
  'initialize-bmad': 'You are the BMad Initialization agent. Set up a new BMad project structure. Create the initial epic and story hierarchy, establish sprint cadence, and ensure all required project documents (PRD, architecture) are scaffolded.',
};

function normalizeSkill(skill: string): string {
  return skill.replace(/^\//, '');
}

function getSkillPrompt(skill: string, triggerCode: string, context?: Record<string, string | undefined>, preferredModel?: string): string {
  const normalized = normalizeSkill(skill);
  const basePrompt = SKILL_PROMPTS[normalized] || `Execute BMad skill "${skill}" following the BMad Method workflow.`;
  const contextStr = context
    ? Object.entries(context).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '';
  const parts = [basePrompt];
  if (triggerCode) parts.push(`Trigger code: ${triggerCode}.`);
  if (contextStr) parts.push(`Context: ${contextStr}.`);
  if (preferredModel) parts.push(`Preferred model: ${preferredModel}.`);
  return parts.join(' ');
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
