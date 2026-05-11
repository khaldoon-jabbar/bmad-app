import type { Story, StoryStatus, AcceptanceCriterion } from '../../shared/types.js';

interface Frontmatter {
  [key: string]: string | undefined;
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Frontmatter = {};
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

const VALID_STATUSES: StoryStatus[] = ['draft', 'in-progress', 'review', 'done', 'blocked'];

function parseAcceptanceCriteria(body: string): AcceptanceCriterion[] {
  const criteria: AcceptanceCriterion[] = [];
  const lines = body.split('\n');
  let inACSection = false;

  for (const line of lines) {
    if (/^#{1,3}\s*(acceptance\s*criteria|ac)/i.test(line)) {
      inACSection = true;
      continue;
    }
    if (inACSection && /^#{1,3}\s/.test(line)) break;
    if (inACSection) {
      const m = line.match(/^\s*-\s*\[([ xX])\]\s*(.+)/);
      if (m) {
        criteria.push({
          id: `ac-${criteria.length + 1}`,
          description: m[2].trim(),
          completed: m[1] !== ' ',
        });
      }
    }
  }
  return criteria;
}

export function parseStoryFile(filename: string, content: string): Story {
  const { frontmatter, body } = parseFrontmatter(content);

  const slug = frontmatter['slug'] ?? filename.replace(/\.md$/, '').replace(/^story-/, '');
  const title = frontmatter['title'] ?? slug;
  const epicId = frontmatter['epic'] ?? frontmatter['epicId'] ?? '';
  const status: StoryStatus = VALID_STATUSES.includes(frontmatter['status'] as StoryStatus)
    ? (frontmatter['status'] as StoryStatus)
    : 'draft';
  const dependencies = frontmatter['dependencies']
    ? frontmatter['dependencies'].split(',').map(d => d.trim()).filter(Boolean)
    : [];

  return {
    slug,
    title,
    status,
    epicId,
    acceptanceCriteria: parseAcceptanceCriteria(body),
    dependencies,
    content: body.trim(),
  };
}
