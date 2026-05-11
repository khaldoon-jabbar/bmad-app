import type { Epic } from '../../shared/types.js';
export declare function parseEpicFile(filename: string, content: string): Epic;
export declare function parseEpicsDir(epicsDir: string): Promise<Epic[]>;
