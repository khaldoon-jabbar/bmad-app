import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
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
import { contextManager } from './context-manager.js';
const server = new McpServer({ name: 'bmad-app', version: '1.0.0' });
const UI_RESOURCE_URI = 'ui://bmad-app/dashboard';
registerAppTool(server, 'bmad_dashboard', {
    title: 'BMad Dashboard',
    description: 'Get full project state for the BMad dashboard',
    inputSchema: { projectPath: z.string().optional() },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async ({ projectPath }) => {
    const state = await getDashboardState(projectPath ?? process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(state) }] };
});
registerAppTool(server, 'bmad_orchestrate', {
    title: 'BMad Orchestrate',
    description: 'Trigger a BMad skill with phase gate validation',
    inputSchema: {
        skill: z.string(),
        triggerCode: z.string(),
        context: z.object({ storySlug: z.string().optional(), epicId: z.string().optional(), track: z.string().optional() }).optional(),
        preferredModel: z.string().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async (args) => {
    const sampling = { createMessage: (params) => server.server.createMessage(params) };
    const result = await handleOrchestrate(args, process.cwd(), sampling);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});
registerAppTool(server, 'bmad_quick', {
    title: 'BMad Quick Mode',
    description: 'Quick dev flow — describe intent and go',
    inputSchema: { intent: z.string() },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async (args) => {
    const sampling = { createMessage: (params) => server.server.createMessage(params) };
    const result = await handleQuickMode(args, sampling);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});
registerAppTool(server, 'bmad_docs', {
    title: 'BMad Docs',
    description: 'Read project documentation',
    inputSchema: {
        document: z.enum(['prd', 'architecture', 'ux', 'project-context', 'epic', 'story']),
        id: z.string().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async (args) => {
    const result = await handleDocs(args, process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});
registerAppTool(server, 'bmad_agents', {
    title: 'BMad Agents',
    description: 'Get the full BMad agent roster with capabilities',
    inputSchema: { projectPath: z.string().optional() },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async ({ projectPath }) => {
    const agents = await handleAgents(projectPath ?? process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(agents) }] };
});
registerAppTool(server, 'bmad_flow', {
    title: 'BMad Flow',
    description: 'Get the BMad method flow graph for a track',
    inputSchema: {
        track: z.enum(['quick', 'bmad', 'enterprise']),
        projectPath: z.string().optional(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async ({ track, projectPath }) => {
    const graph = await handleFlow(track, projectPath ?? process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(graph) }] };
});
registerAppTool(server, 'bmad_parallel', {
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
}, async ({ action, tasks, maxConcurrency }) => {
    const result = await handleParallel({ action, tasks, maxConcurrency }, process.cwd());
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});
registerAppTool(server, 'bmad_help', {
    title: 'BMad Help',
    description: 'Chat with BMad Help assistant for guidance on BMad Method',
    inputSchema: {
        message: z.string(),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async ({ message }) => {
    const sampling = { createMessage: (params) => server.server.createMessage(params) };
    try {
        const prompt = `Execute BMad skill "/bmad-help". User question: ${message}`;
        const responseText = await contextManager.sample('help', prompt, sampling.createMessage);
        return { content: [{ type: 'text', text: JSON.stringify({ role: 'assistant', content: responseText, timestamp: Date.now() }) }] };
    }
    catch {
        return { content: [{ type: 'text', text: JSON.stringify({ role: 'assistant', content: 'BMad Help is available. Ask me anything about the BMad Method!', timestamp: Date.now() }) }] };
    }
});
registerAppTool(server, 'bmad_reset_context', {
    title: 'BMad Reset Context',
    description: 'Reset a workflow context window to start a fresh conversation',
    inputSchema: {
        workflow: z.enum(['help', 'dev', 'pm', 'arch', 'init']),
    },
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async ({ workflow }) => {
    contextManager.reset(workflow);
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'reset', workflow, message: `Context for "${workflow}" has been cleared.` }) }] };
});
registerAppTool(server, 'bmad_context_status', {
    title: 'BMad Context Status',
    description: 'Get message counts for all active workflow context windows',
    inputSchema: {},
    _meta: { ui: { resourceUri: UI_RESOURCE_URI } },
}, async () => {
    const status = contextManager.getStatus();
    return { content: [{ type: 'text', text: JSON.stringify(status) }] };
});
registerAppResource(server, 'BMad Dashboard', UI_RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => {
    const htmlPath = path.join(import.meta.dirname, '../../ui/index.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    return { contents: [{ uri: UI_RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html }] };
});
const transport = new StdioServerTransport();
await server.connect(transport);
