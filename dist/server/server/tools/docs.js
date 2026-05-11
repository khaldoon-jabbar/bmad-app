import fs from 'node:fs/promises';
import path from 'node:path';
const DOC_MAP = {
    prd: 'PRD.md',
    architecture: 'architecture.md',
    ux: 'ux-spec.md',
    'project-context': 'project-context.md',
};
export async function handleDocs(input, projectPath) {
    const bmadOutput = path.join(projectPath, '_bmad-output');
    if (input.document === 'epic' && input.id) {
        const epicPath = path.join(bmadOutput, 'planning-artifacts', 'epics', `epic-${input.id}.md`);
        try {
            const content = await fs.readFile(epicPath, 'utf-8');
            return { content, title: `Epic: ${input.id}` };
        }
        catch {
            return { content: '', title: 'Epic not found' };
        }
    }
    if (input.document === 'story' && input.id) {
        const storyPath = path.join(bmadOutput, 'planning-artifacts', 'stories', `story-${input.id}.md`);
        try {
            const content = await fs.readFile(storyPath, 'utf-8');
            return { content, title: `Story: ${input.id}` };
        }
        catch {
            return { content: '', title: 'Story not found' };
        }
    }
    const filename = DOC_MAP[input.document];
    if (!filename)
        return { content: '', title: 'Unknown document' };
    try {
        const content = await fs.readFile(path.join(bmadOutput, filename), 'utf-8');
        return { content, title: filename.replace('.md', '') };
    }
    catch {
        return { content: '', title: `${filename} not found` };
    }
}
