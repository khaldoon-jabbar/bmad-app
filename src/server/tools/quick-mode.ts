import type { QuickModeInput } from '../../shared/types.js';

export async function handleQuickMode(input: QuickModeInput): Promise<{ status: string; message: string }> {
  return {
    status: 'triggered',
    message: `Routing intent to bmad-quick-dev: "${input.intent}"`,
  };
}
