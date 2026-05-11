import * as yaml from 'js-yaml';
import type { SprintStatus, Epic, Story, StoryStatus, EpicStatus, SprintStatusType } from '../../shared/types.js';

interface RawSprintYaml {
  sprint?: { number?: number; status?: string; started?: string };
  epics?: Array<{
    id?: string;
    title?: string;
    status?: string;
    stories?: Array<{ slug?: string; title?: string; status?: string }>;
  }>;
}

const VALID_STORY_STATUSES: StoryStatus[] = ['draft', 'in-progress', 'review', 'done', 'blocked'];
const VALID_EPIC_STATUSES: EpicStatus[] = ['draft', 'in-progress', 'done'];
const VALID_SPRINT_STATUSES: SprintStatusType[] = ['planning', 'active', 'complete'];

export function parseSprintStatus(content: string): SprintStatus | null {
  try {
    const raw = yaml.load(content) as RawSprintYaml;
    if (!raw?.sprint) return null;

    const status: SprintStatusType = VALID_SPRINT_STATUSES.includes(raw.sprint.status as SprintStatusType)
      ? (raw.sprint.status as SprintStatusType)
      : 'planning';

    const epics: Epic[] = (raw.epics ?? []).map((e) => {
      const stories: Story[] = (e.stories ?? []).map((s) => ({
        slug: s.slug ?? 'unknown',
        title: s.title ?? 'Untitled',
        status: VALID_STORY_STATUSES.includes(s.status as StoryStatus) ? (s.status as StoryStatus) : 'draft',
        epicId: e.id ?? '',
        acceptanceCriteria: [],
        dependencies: [],
        content: '',
      }));

      return {
        id: e.id ?? 'unknown',
        title: e.title ?? 'Untitled Epic',
        status: VALID_EPIC_STATUSES.includes(e.status as EpicStatus) ? (e.status as EpicStatus) : 'draft',
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
  } catch {
    return null;
  }
}
