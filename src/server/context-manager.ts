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
  content: { type: 'text'; text: string };
}

export interface ContextWindow {
  workflowId: WorkflowId;
  messages: ContextMessage[];
  createdAt: number;
  lastAccessedAt: number;
}

const NEW_CONTEXT_MARKER = '[NEW_CONTEXT]';

class ContextManager {
  private windows = new Map<WorkflowId, ContextWindow>();

  getMessageCount(workflowId: WorkflowId): number {
    return this.windows.get(workflowId)?.messages.length ?? 0;
  }

  /**
   * Append a user message and call createMessage with the full context.
   * Appends the assistant response to the context afterward.
   * If the response contains [NEW_CONTEXT], clears the context.
   *
   * Returns the assistant response text.
   */
  async sample(
    workflowId: WorkflowId,
    userText: string,
    createMessage: (params: any) => Promise<any>,
    maxTokens = 4096,
  ): Promise<string> {
    if (workflowId === 'init') {
      this.reset(workflowId);
    }

    let window = this.windows.get(workflowId);
    if (!window) {
      window = {
        workflowId,
        messages: [],
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };
      this.windows.set(workflowId, window);
    }

    window.lastAccessedAt = Date.now();

    const userMessage: ContextMessage = { role: 'user', content: { type: 'text', text: userText } };
    window.messages.push(userMessage);

    const result = await createMessage({
      messages: window.messages,
      maxTokens,
    });

    const content = result?.content;
    const rawText = Array.isArray(content)
      ? content[0]?.text
      : typeof content === 'string' ? content : content?.text;
    const text: string = rawText || 'No response.';

    const assistantMessage: ContextMessage = { role: 'assistant', content: { type: 'text', text } };
    window.messages.push(assistantMessage);

    if (text.includes(NEW_CONTEXT_MARKER)) {
      this.reset(workflowId);
    }

    return text;
  }

  reset(workflowId: WorkflowId): void {
    this.windows.delete(workflowId);
  }

  getStatus(): Record<WorkflowId, number> {
    const status = {} as Record<WorkflowId, number>;
    for (const [id, window] of this.windows) {
      status[id] = window.messages.length;
    }
    return status;
  }
}

// Singleton instance — survives across tool calls within the same server process
export const contextManager = new ContextManager();
