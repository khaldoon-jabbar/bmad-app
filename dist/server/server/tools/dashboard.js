import fs from 'node:fs/promises';
import path from 'node:path';
import { parseSprintStatus } from '../parsers/sprint.js';
import { parseEpicFile } from '../parsers/epics.js';
import { parseStoryFile } from '../parsers/stories.js';
async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    }
    catch {
        return false;
    }
}
async function readFileIfExists(p) {
    try {
        return await fs.readFile(p, 'utf-8');
    }
    catch {
        return null;
    }
}
function inferPhase(state) {
    if (state.sprint)
        return 'implementation';
    if (state.epics.length > 0)
        return 'solutioning';
    if (state.documents.prd)
        return 'planning';
    if (state.documents.projectContext)
        return 'analysis';
    return null;
}
export async function getDashboardState(projectPath) {
    const bmadOutput = path.join(projectPath, '_bmad-output');
    const documents = {
        prd: await fileExists(path.join(bmadOutput, 'PRD.md')),
        architecture: await fileExists(path.join(bmadOutput, 'architecture.md')),
        uxSpec: await fileExists(path.join(bmadOutput, 'ux-spec.md')),
        projectContext: await fileExists(path.join(bmadOutput, 'project-context.md')),
    };
    let sprint = null;
    const sprintContent = await readFileIfExists(path.join(bmadOutput, 'sprint-status.yaml'));
    if (sprintContent) {
        sprint = parseSprintStatus(sprintContent);
    }
    const epics = [];
    const epicsDir = path.join(bmadOutput, 'planning-artifacts', 'epics');
    try {
        const files = await fs.readdir(epicsDir);
        for (const file of files) {
            if (file.startsWith('epic-') && file.endsWith('.md')) {
                const content = await fs.readFile(path.join(epicsDir, file), 'utf-8');
                const epic = parseEpicFile(file, content);
                const storiesDir = path.join(bmadOutput, 'planning-artifacts', 'stories');
                try {
                    const storyFiles = await fs.readdir(storiesDir);
                    for (const sf of storyFiles) {
                        if (sf.endsWith('.md')) {
                            const storyContent = await fs.readFile(path.join(storiesDir, sf), 'utf-8');
                            const story = parseStoryFile(sf, storyContent);
                            if (story.epicId === epic.id) {
                                epic.stories.push(story);
                            }
                        }
                    }
                }
                catch { }
                epics.push(epic);
            }
        }
    }
    catch { }
    const state = {
        track: null,
        phase: null,
        documents,
        epics,
        sprint,
        config: null,
        recentActions: [],
    };
    state.phase = inferPhase(state);
    state.recentActions = await deriveRecentActions(bmadOutput, state);
    return state;
}
async function deriveRecentActions(bmadOutput, state) {
    const actions = [];
    const docFiles = [
        { name: 'PRD.md', action: 'Created PRD' },
        { name: 'architecture.md', action: 'Created Architecture' },
        { name: 'ux-spec.md', action: 'Created UX Spec' },
        { name: 'project-context.md', action: 'Created Project Context' },
    ];
    for (const { name, action } of docFiles) {
        const filePath = path.join(bmadOutput, name);
        try {
            const stat = await fs.stat(filePath);
            actions.push({ id: name, action, target: name, timestamp: stat.mtime.toISOString() });
        }
        catch { }
    }
    for (const epic of state.epics) {
        for (const story of epic.stories) {
            if (story.status !== 'draft') {
                const storyPath = path.join(bmadOutput, 'planning-artifacts', 'stories', `${story.slug}.md`);
                let ts = new Date(0).toISOString();
                try {
                    const stat = await fs.stat(storyPath);
                    ts = stat.mtime.toISOString();
                }
                catch { }
                const label = story.status === 'done' ? 'Completed' : story.status === 'in-progress' ? 'Started' : 'Updated';
                actions.push({ id: story.slug, action: `${label} story`, target: story.title || story.slug, timestamp: ts });
            }
        }
    }
    actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return actions.slice(0, 5);
}
