// @ts-nocheck
// Vercel Edge Function — Remote MCP endpoint (stateless)

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

export const config = { runtime: 'edge' };

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

export default async function handler(request: Request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      },
    });
  }

  // Bare GET — return server info
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      name: 'bmad-app',
      version: '1.0.0',
      description: 'BMad Method Visual Management MCP Server',
      tools: ['bmad_dashboard', 'bmad_orchestrate', 'bmad_quick', 'bmad_docs', 'bmad_agents', 'bmad_flow', 'bmad_parallel'],
      usage: 'POST to this endpoint to initialize an MCP session',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      },
    });
  }

  if (request.method === 'POST') {
    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    await server.connect(transport);
    const response = await transport.handleRequest(request);

    // Inject CORS headers
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', 'mcp-session-id');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }

  if (request.method === 'DELETE') {
    return new Response(null, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
