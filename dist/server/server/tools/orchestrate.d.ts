import type { OrchestrateInput, OrchestrateOutput } from '../../shared/types.js';
export declare function handleOrchestrate(input: OrchestrateInput, projectPath: string, sampling?: {
    createMessage: (params: any) => Promise<any>;
}): Promise<OrchestrateOutput>;
