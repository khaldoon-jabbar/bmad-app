import { contextManager } from '../context-manager.js';
const HELP_PATTERN = /\b(help|how do i|what is|explain|guide|tutorial)\b/i;
function resolveWorkflow(intent) {
    if (HELP_PATTERN.test(intent))
        return 'help';
    return 'dev';
}
export async function handleQuickMode(input, sampling) {
    if (sampling) {
        try {
            const workflowId = resolveWorkflow(input.intent);
            const prompt = workflowId === 'help'
                ? `Execute BMad skill "/bmad-help". User question: ${input.intent}`
                : `You are BMad Quick Dev mode. The user wants to quickly accomplish the following intent: "${input.intent}". Analyze what's needed, break it into steps if necessary, and provide a clear action plan or direct answer. Be concise and actionable.`;
            const responseText = await contextManager.sample(workflowId, prompt, sampling.createMessage);
            return { status: 'triggered', message: responseText };
        }
        catch {
            // Fall through if sampling fails
        }
    }
    return {
        status: 'triggered',
        message: `Routing intent to bmad-quick-dev: "${input.intent}"`,
    };
}
