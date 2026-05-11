// @ts-nocheck
// Vercel Serverless Function — Remote MCP endpoint
// This is a standalone handler; Vercel bundles it separately from the Vite UI build.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

function createServer() {
  const server = new McpServer({ name: 'bmad-app', version: '1.0.0' });

  server.registerTool(
    'bmad_dashboard',
    {
      title: 'BMad Dashboard',
      description: 'Get full project state for the BMad dashboard',
      inputSchema: { projectPath: z.string().optional() },
    },
    async ({ projectPath }) => {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'remote', message: 'Connect with a local project path for full state' }) }] };
    },
  );

  server.registerTool(
    'bmad_orchestrate',
    {
      title: 'BMad Orchestrate',
      description: 'Trigger a BMad skill with phase gate validation',
      inputSchema: { skill: z.string(), triggerCode: z.string(), context: z.record(z.string()).optional() },
    },
    async ({ skill, triggerCode, context }) => {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'triggered', skill, triggerCode }) }] };
    },
  );

  server.registerTool(
    'bmad_quick',
    {
      title: 'BMad Quick Mode',
      description: 'Quick dev flow — compressed intent-to-code',
      inputSchema: { intent: z.string() },
    },
    async ({ intent }) => {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'routed', intent }) }] };
    },
  );

  server.registerTool(
    'bmad_docs',
    {
      title: 'BMad Docs',
      description: 'Read project documentation',
      inputSchema: { document: z.enum(['prd', 'architecture', 'ux', 'project-context', 'epic', 'story']), id: z.string().optional() },
    },
    async ({ document, id }) => {
      return { content: [{ type: 'text', text: JSON.stringify({ document, id, content: 'Remote mode — connect locally for file access' }) }] };
    },
  );

  server.registerTool(
    'bmad_agents',
    {
      title: 'BMad Agents',
      description: 'Get the full BMad agent roster with capabilities',
      inputSchema: { projectPath: z.string().optional() },
    },
    async () => {
      const agents = [
        { emoji: '📊', name: 'Mary', role: 'Analyst', skill: 'bmad-analyst', phase: 'analysis', triggers: ['BS', 'MR', 'DR', 'TR', 'CB', 'PF'] },
        { emoji: '📚', name: 'Paige', role: 'Tech Writer', skill: 'bmad-tech-writer', phase: 'analysis', triggers: ['DP', 'WD', 'VD'] },
        { emoji: '📋', name: 'John', role: 'Product Manager', skill: 'bmad-pm', phase: 'planning', triggers: ['CP', 'VP', 'EP', 'CE', 'IR', 'CC'] },
        { emoji: '🎨', name: 'Sally', role: 'UX Designer', skill: 'bmad-ux-designer', phase: 'planning', triggers: ['CU'] },
        { emoji: '🏗️', name: 'Winston', role: 'Architect', skill: 'bmad-architect', phase: 'solutioning', triggers: ['CA', 'IR'] },
        { emoji: '💻', name: 'Amelia', role: 'Developer', skill: 'bmad-agent-dev', phase: 'implementation', triggers: ['DS', 'QD', 'CR', 'SP', 'CS', 'RT'] },
      ];
      return { content: [{ type: 'text', text: JSON.stringify(agents) }] };
    },
  );

  server.registerTool(
    'bmad_flow',
    {
      title: 'BMad Flow',
      description: 'Get the BMad method flow graph for a track',
      inputSchema: { track: z.enum(['quick', 'bmad', 'enterprise']), projectPath: z.string().optional() },
    },
    async ({ track }) => {
      return { content: [{ type: 'text', text: JSON.stringify({ track, nodes: [], edges: [] }) }] };
    },
  );

  server.registerTool(
    'bmad_parallel',
    {
      title: 'BMad Parallel',
      description: 'Analyze and execute independent tasks in parallel',
      inputSchema: { action: z.enum(['analyze', 'execute']), tasks: z.array(z.object({ skill: z.string(), triggerCode: z.string() })).optional(), maxConcurrency: z.number().optional() },
    },
    async ({ action }) => {
      return { content: [{ type: 'text', text: JSON.stringify({ action, result: 'Remote mode — connect locally for execution' }) }] };
    },
  );

  return server;
}

const sessions = new Map();

export default async function handler(req: any, res: any) {
  // CORS for MCP clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const sessionId = req.headers['mcp-session-id'];

  if (req.method === 'GET') {
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const session = sessions.get(sessionId);
    await session.transport.handleRequest(req, res);
    return;
  }

  if (req.method === 'POST') {
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      await session.transport.handleRequest(req, res);
      return;
    }

    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id: string) => {
        sessions.set(id, { server, transport });
      },
    });

    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  if (req.method === 'DELETE') {
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      await session.transport.handleRequest(req, res);
      sessions.delete(sessionId);
      return;
    }
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
