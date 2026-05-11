/**
 * Context Window Manager for BMad workflows.
 *
 * Each workflow (help, dev, pm, arch) maintains its own persistent
 * message history. Multiple sampling calls within the same workflow
 * accumulate in the same context — like a persistent chat session.
 *
 * A fresh context is created when:
 * - The workflow has never been used before
 * - The assistant response contains [NEW_CONTEXT]
 * - The user explicitly resets via bmad_reset_context
 */
export type WorkflowId = 'help' | 'dev' | 'pm' | 'arch' | 'init';
export interface ContextMessage {
    role: 'user' | 'assistant';
    content: {
        type: 'text';
        text: string;
    };
}
export interface ContextWindow {
    workflowId: WorkflowId;
    messages: ContextMessage[];
    createdAt: number;
    lastAccessedAt: number;
}
declare class ContextManager {
    private windows;
    getMessageCount(workflowId: WorkflowId): number;
    /**
     * Append a user message and call createMessage with the full context.
     * Appends the assistant response to the context afterward.
     * If the response contains [NEW_CONTEXT], clears the context.
     *
     * Returns the assistant response text.
     */
    sample(workflowId: WorkflowId, userText: string, createMessage: (params: any) => Promise<any>, maxTokens?: number): Promise<string>;
    reset(workflowId: WorkflowId): void;
    getStatus(): Record<WorkflowId, number>;
}
export declare const contextManager: ContextManager;
export {};
