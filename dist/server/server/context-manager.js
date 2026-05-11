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
    locks = new Map();
    getMessageCount(workflowId) {
        return this.windows.get(workflowId)?.messages.length ?? 0;
    }
    /**
     * Transactional sampling: only persists messages on success.
     * Serializes concurrent calls per workflow to prevent interleaving.
     * Strips [NEW_CONTEXT] marker from returned text.
     */
    async sample(workflowId, userText, createMessage, maxTokens = 4096) {
        const execute = async () => {
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
            const messagesWithNew = [...window.messages, userMessage];
            const result = await createMessage({
                messages: messagesWithNew,
                maxTokens,
            });
            const content = result?.content;
            const rawText = Array.isArray(content)
                ? content[0]?.text
                : typeof content === 'string' ? content : content?.text;
            const text = rawText || 'No response.';
            const assistantMessage = { role: 'assistant', content: { type: 'text', text } };
            window.messages.push(userMessage, assistantMessage);
            if (text.includes(NEW_CONTEXT_MARKER)) {
                this.reset(workflowId);
                return text.replaceAll(NEW_CONTEXT_MARKER, '').trim();
            }
            return text;
        };
        const prev = this.locks.get(workflowId) ?? Promise.resolve();
        const current = prev.then(execute, execute);
        this.locks.set(workflowId, current.then(() => { }, () => { }));
        return current;
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
