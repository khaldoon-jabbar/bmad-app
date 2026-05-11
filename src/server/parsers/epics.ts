import * as fs from 'fs/promises';
import * as path from 'path';
import type { Epic, EpicStatus, Story } from '../../shared/types.js';

const VALID_EPIC_STATUSES: EpicStatus[] = ['draft', 'in-progress', 'done'];

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }
  return { frontmatter, body: match[2] };
}

function extractStoryReferences(body: string): string[] {
  const refs: string[] = [];
  const matches = body.matchAll(/story-[\w-]+/gi);
  for (const m of matches) {
    if (!refs.includes(m[0])) refs.push(m[0]);
  }
  return refs;
}

export function parseEpicFile(filename: string, content: string): Epic {
  const { frontmatter, body } = parseFrontmatter(content);

  const id = frontmatter['id'] ?? filename.replace(/\.md$/, '').replace(/^epic-/, '');
  const title = frontmatter['title'] ?? id;
  const rawStatus = frontmatter['status'];
  const status: EpicStatus = VALID_EPIC_STATUSES.includes(rawStatus as EpicStatus)
    ? (rawStatus as EpicStatus)
    : 'draft';

  const storyRefs = extractStoryReferences(body);
  const stories: Story[] = storyRefs.map((ref) => ({
    slug: ref,
    title: ref,
    status: 'draft',
    epicId: id,
    acceptanceCriteria: [],
    dependencies: [],
    content: '',
  }));

  return {
    id,
    title,
    status,
    description: body.trim(),
    stories,
  };
}

export async function parseEpicsDir(epicsDir: string): Promise<Epic[]> {
  try {
    const entries = await fs.readdir(epicsDir);
    const epicFiles = entries.filter((f) => f.startsWith('epic-') && f.endsWith('.md'));
    const epics: Epic[] = [];
    for (const file of epicFiles) {
      const content = await fs.readFile(path.join(epicsDir, file), 'utf-8');
      epics.push(parseEpicFile(file, content));
    }
    return epics;
  } catch {
    return [];
  }
}
