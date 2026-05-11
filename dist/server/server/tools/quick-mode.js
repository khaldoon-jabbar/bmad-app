import { contextManager } from '../context-manager.js';
export async function handleQuickMode(input, sampling) {
    if (sampling) {
        try {
            const prompt = `You are BMad Quick Dev mode. The user wants to quickly accomplish the following intent: "${input.intent}". Analyze what's needed, break it into steps if necessary, and provide a clear action plan or direct answer. Be concise and actionable.`;
            const responseText = await contextManager.sample('dev', prompt, sampling.createMessage);
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
