import type { QuickModeInput } from '../../shared/types.js';

export async function handleQuickMode(
  input: QuickModeInput,
  sampling?: { createMessage: (params: any) => Promise<any> },
): Promise<{ status: string; message: string }> {
  if (sampling) {
    try {
      const prompt = `You are BMad Quick Dev mode. The user wants to quickly accomplish the following intent: "${input.intent}". Analyze what's needed, break it into steps if necessary, and provide a clear action plan or direct answer. Be concise and actionable.`;

      const result = await sampling.createMessage({
        messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
        maxTokens: 4096,
      });

      const responseText = result?.content?.[0]?.text || result?.content || 'Quick mode processed your intent.';

      return {
        status: 'triggered',
        message: typeof responseText === 'string' ? responseText : JSON.stringify(responseText),
      };
    } catch {
      // Fall through if sampling fails
    }
  }

  return {
    status: 'triggered',
    message: `Routing intent to bmad-quick-dev: "${input.intent}"`,
  };
}
