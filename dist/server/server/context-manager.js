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
const NEW_CONTEXT_MARKER = '[NEW_CONTEXT]';
class ContextManager {
    windows = new Map();
    getMessageCount(workflowId) {
        return this.windows.get(workflowId)?.messages.length ?? 0;
    }
    /**
     * Append a user message and call createMessage with the full context.
     * Appends the assistant response to the context afterward.
     * If the response contains [NEW_CONTEXT], clears the context.
     *
     * Returns the assistant response text.
     */
    async sample(workflowId, userText, createMessage, maxTokens = 4096) {
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
        const userMessage = { role: 'user', content: { type: 'text', text: userText } };
        window.messages.push(userMessage);
        const result = await createMessage({
            messages: window.messages,
            maxTokens,
        });
        const responseText = result?.content?.[0]?.text || result?.content || 'No response.';
        const text = typeof responseText === 'string' ? responseText : JSON.stringify(responseText);
        const assistantMessage = { role: 'assistant', content: { type: 'text', text } };
        window.messages.push(assistantMessage);
        if (text.includes(NEW_CONTEXT_MARKER)) {
            this.reset(workflowId);
        }
        return text;
    }
    reset(workflowId) {
        this.windows.delete(workflowId);
    }
    getStatus() {
        const status = {};
        for (const [id, window] of this.windows) {
            status[id] = window.messages.length;
        }
        return status;
    }
}
// Singleton instance — survives across tool calls within the same server process
export const contextManager = new ContextManager();
