import type { QuickModeInput } from '../../shared/types.js';
export declare function handleQuickMode(input: QuickModeInput, sampling?: {
    createMessage: (params: any) => Promise<any>;
}): Promise<{
    status: string;
    message: string;
}>;
