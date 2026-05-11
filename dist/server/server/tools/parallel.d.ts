import type { ParallelOutput, ParallelTask } from '../../shared/types.js';
export declare function handleParallel(input: {
    action: 'analyze' | 'execute';
    tasks?: ParallelTask[];
    maxConcurrency?: number;
}, projectPath: string): Promise<ParallelOutput>;
