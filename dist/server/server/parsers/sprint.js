import * as yaml from 'js-yaml';
const VALID_STORY_STATUSES = ['draft', 'in-progress', 'review', 'done', 'blocked'];
const VALID_EPIC_STATUSES = ['draft', 'in-progress', 'done'];
const VALID_SPRINT_STATUSES = ['planning', 'active', 'complete'];
export function parseSprintStatus(content) {
    try {
        const raw = yaml.load(content);
        if (!raw?.sprint)
            return null;
        const status = VALID_SPRINT_STATUSES.includes(raw.sprint.status)
            ? raw.sprint.status
            : 'planning';
        const epics = (raw.epics ?? []).map((e) => {
            const stories = (e.stories ?? []).map((s) => ({
                slug: s.slug ?? 'unknown',
                title: s.title ?? 'Untitled',
                status: VALID_STORY_STATUSES.includes(s.status) ? s.status : 'draft',
                epicId: e.id ?? '',
                acceptanceCriteria: [],
                dependencies: [],
                content: '',
            }));
            return {
                id: e.id ?? 'unknown',
                title: e.title ?? 'Untitled Epic',
                status: VALID_EPIC_STATUSES.includes(e.status) ? e.status : 'draft',
                description: '',
                stories,
            };
        });
        return {
            number: raw.sprint.number ?? 1,
            status,
            started: raw.sprint.started ?? new Date().toISOString().split('T')[0],
            epics,
        };
    }
    catch {
        return null;
    }
}
