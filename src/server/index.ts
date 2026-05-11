import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDashboardState } from './tools/dashboard.js';
import { handleOrchestrate } from './tools/orchestrate.js';
import { handleQuickMode } from './tools/quick-mode.js';
import { handleDocs } from './tools/docs.js';
import { handleAgents } from './tools/agents.js';
import { handleFlow } from './tools/flow.js';
import { handleParallel } from './tools/parallel.js';

const server = new McpServer({ name: 'bmad-app', version: '1.0.0' });

const UI_RESOURCE_URI = 'ui://bmad-app/dashboard';
const UI_MIME_TYPE = 'text/html';

server.registerTool(
  'bmad_dashboard',
  {
    title: 'BMad Dashboard',
    description: 'Get full project state for the BMad dashboard',
    inputSchema: { projectPath: z.string().optional() },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async ({ projectPath }) => {
    const state = await getDashboardState(projectPath ?? process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(state) }] };
  },
);

server.registerTool(
  'bmad_orchestrate',
  {
    title: 'BMad Orchestrate',
    description: 'Trigger a BMad skill with phase gate validation',
    inputSchema: {
      skill: z.string(),
      triggerCode: z.string(),
      context: z.object({ storySlug: z.string().optional(), epicId: z.string().optional(), track: z.string().optional() }).optional(),
      preferredModel: z.string().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async (args) => {
    const sampling = { createMessage: (params: any) => server.server.createMessage(params) };
    const result = await handleOrchestrate(args, process.cwd(), sampling);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  'bmad_quick',
  {
    title: 'BMad Quick Mode',
    description: 'Quick dev flow — describe intent and go',
    inputSchema: { intent: z.string() },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async (args) => {
    const sampling = { createMessage: (params: any) => server.server.createMessage(params) };
    const result = await handleQuickMode(args, sampling);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  'bmad_docs',
  {
    title: 'BMad Docs',
    description: 'Read project documentation',
    inputSchema: {
      document: z.enum(['prd', 'architecture', 'ux', 'project-context', 'epic', 'story']),
      id: z.string().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async (args) => {
    const result = await handleDocs(args, process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  'bmad_agents',
  {
    title: 'BMad Agents',
    description: 'Get the full BMad agent roster with capabilities',
    inputSchema: { projectPath: z.string().optional() },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async ({ projectPath }) => {
    const agents = await handleAgents(projectPath ?? process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(agents) }] };
  },
);

server.registerTool(
  'bmad_flow',
  {
    title: 'BMad Flow',
    description: 'Get the BMad method flow graph for a track',
    inputSchema: {
      track: z.enum(['quick', 'bmad', 'enterprise']),
      projectPath: z.string().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async ({ track, projectPath }) => {
    const graph = await handleFlow(track, projectPath ?? process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(graph) }] };
  },
);

server.registerTool(
  'bmad_parallel',
  {
    title: 'BMad Parallel',
    description: 'Analyze and execute parallel tasks',
    inputSchema: {
      action: z.enum(['analyze', 'execute']),
      tasks: z.array(z.object({
        skill: z.string(),
        triggerCode: z.string(),
        context: z.record(z.string(), z.string()),
        label: z.string(),
      })).optional(),
      maxConcurrency: z.number().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async ({ action, tasks, maxConcurrency }) => {
    const result = await handleParallel({ action, tasks, maxConcurrency }, process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  'bmad_help',
  {
    title: 'BMad Help',
    description: 'Chat with BMad Help assistant for guidance on BMad Method',
    inputSchema: {
      message: z.string(),
      history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.number(),
      })).optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
  },
  async ({ message, history }) => {
    const sampling = { createMessage: (params: any) => server.server.createMessage(params) };
    try {
      const historyContext = history?.length
        ? '\n\nConversation history:\n' + history.map((m: any) => `${m.role}: ${m.content}`).join('\n')
        : '';
      const prompt = `Execute BMad skill "/bmad-help". User question: ${message}${historyContext}`;
      const result = await sampling.createMessage({
        messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
        maxTokens: 4096,
      });
      const responseText = (result?.content as any)?.[0]?.text || result?.content || 'I can help with BMad Method questions. What would you like to know?';
      return { content: [{ type: 'text', text: JSON.stringify({ role: 'assistant', content: typeof responseText === 'string' ? responseText : JSON.stringify(responseText), timestamp: Date.now() }) }] };
    } catch {
      return { content: [{ type: 'text', text: JSON.stringify({ role: 'assistant', content: 'BMad Help is available. Ask me anything about the BMad Method!', timestamp: Date.now() }) }] };
    }
  },
);

server.registerResource(
  'BMad Dashboard',
  UI_RESOURCE_URI,
  { mimeType: UI_MIME_TYPE },
  async () => {
    const htmlPath = path.join(import.meta.dirname, '../../ui/index.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    return { contents: [{ uri: UI_RESOURCE_URI, mimeType: UI_MIME_TYPE, text: html }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
