export type Track = 'quick' | 'bmad' | 'enterprise';
export type Phase = 'analysis' | 'planning' | 'solutioning' | 'implementation';
export type StoryStatus = 'draft' | 'in-progress' | 'review' | 'done' | 'blocked';
export type EpicStatus = 'draft' | 'in-progress' | 'done';
export type SprintStatusType = 'planning' | 'active' | 'complete';
export type FlowNodeStatus = 'done' | 'active' | 'in-progress' | 'pending';
export type ViewId = 'dashboard' | 'phase' | 'sprint-board' | 'epic-detail' | 'story-detail' | 'quick-mode' | 'docs' | 'agent-roster' | 'flow-diagram' | 'parallel';
export interface AcceptanceCriterion {
    id: string;
    description: string;
    completed: boolean;
}
export interface Story {
    slug: string;
    title: string;
    status: StoryStatus;
    epicId: string;
    acceptanceCriteria: AcceptanceCriterion[];
    dependencies: string[];
    content: string;
}
export interface Epic {
    id: string;
    title: string;
    status: EpicStatus;
    description: string;
    stories: Story[];
}
export interface SprintStatus {
    number: number;
    status: SprintStatusType;
    started: string;
    epics: Epic[];
}
export interface BmadConfig {
    projectName: string;
    track: Track;
    createdAt: string;
}
export interface ProjectState {
    track: Track | null;
    phase: Phase | null;
    documents: {
        prd: boolean;
        architecture: boolean;
        uxSpec: boolean;
        projectContext: boolean;
    };
    epics: Epic[];
    sprint: SprintStatus | null;
    config: BmadConfig | null;
}
export interface TriggerCode {
    code: string;
    label: string;
    description: string;
}
export interface Agent {
    id: string;
    name: string;
    emoji: string;
    role: string;
    skillId: string;
    phase: Phase;
    triggerCodes: TriggerCode[];
    outputsExist: boolean;
}
export interface FlowNode {
    id: string;
    label: string;
    type: 'phase' | 'workflow';
    phase: Phase;
    status: FlowNodeStatus;
    agent?: string;
    triggerCode?: string;
}
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}
export interface FlowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
    track: Track;
}
export interface ParallelTask {
    skill: string;
    triggerCode: string;
    context: Record<string, string>;
    label: string;
}
export interface ParallelTaskGroup {
    id: string;
    tasks: ParallelTask[];
    canRunInParallel: boolean;
    reason: string;
}
export interface PhaseGateResult {
    allowed: boolean;
    missingPrerequisites: string[];
    message: string;
}
export interface DashboardInput {
    projectPath?: string;
}
export interface OrchestrateInput {
    skill: string;
    triggerCode: string;
    context?: {
        storySlug?: string;
        epicId?: string;
    };
}
export interface OrchestrateOutput {
    status: 'triggered' | 'blocked';
    message: string;
    gateResult?: PhaseGateResult;
}
export interface QuickModeInput {
    intent: string;
}
export interface DocsInput {
    document: 'prd' | 'architecture' | 'ux' | 'project-context' | 'epic' | 'story';
    id?: string;
}
export interface DocsOutput {
    content: string;
    title: string;
}
export interface AgentsInput {
    projectPath?: string;
}
export interface FlowInput {
    track: Track;
    projectPath?: string;
}
export interface ParallelInput {
    action: 'analyze' | 'execute';
    tasks?: ParallelTask[];
    maxConcurrency?: number;
}
export interface ParallelOutput {
    groups: ParallelTaskGroup[];
    message: string;
}
export interface NavigationState {
    view: ViewId;
    params?: Record<string, string>;
}
