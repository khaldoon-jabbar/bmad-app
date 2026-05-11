# BMad App

Visual MCP App for managing BMad Method projects.

## Overview

An interactive MCP App that renders inline inside MCP hosts (Claude Desktop, VS Code Copilot, etc.) providing a visual dashboard for BMad Method-driven projects — sprint tracking, epic/story management, phase orchestration, and quick-mode development.

**Trigger:** `/bmad-app`

## Features

- **Dashboard** — Phase indicator, sprint progress, epic cards, recent activity, smart next-action buttons
- **Sprint Board** — Kanban-style board with epic filtering, progress bars, story cards
- **Flow Diagram** — Interactive BMad flow with track selector (Quick/BMad/Enterprise), live state overlay, click-to-act
- **Agent Roster** — All 6 BMad agents with capabilities, status, and one-click launch
- **Quick Mode** — Text input for quick dev tasks with inline results
- **Documents** — Full-text searchable project documentation browser
- **Parallel Execution** — Identifies parallelizable tasks, triggers concurrent workflows
- **Help Chat** — Persistent context conversation about BMad method

## Architecture

### MCP Sampling (Sub-Agent Delegation)

When a user clicks an action button, the server delegates work via **MCP Sampling** (`createMessage`). Each workflow runs in its own context window:

```
UI Button Click → bmad_orchestrate tool
  → ContextManager.sample(workflowId, prompt)
    → server.createMessage() → Host LLM processes as sub-agent
    → Response appended to workflow context
  → Result displayed in ToolResultPanel
```

**Context windows per workflow:**
- `help` — Persistent chat for BMad questions (accumulates)
- `dev` — Development work (stories, code review, quick dev)
- `pm` — Project management queries
- `arch` — Architecture work
- `init` — Fresh context every time (project initialization)

Context auto-resets when response contains `[NEW_CONTEXT]` marker, or manually via `bmad_reset_context`.

### MCP Tools

| Tool | Description |
|------|-------------|
| `bmad_dashboard` | Returns full project state (phase, sprint, epics, docs) |
| `bmad_orchestrate` | Triggers BMad skills via sampling with persistent context |
| `bmad_quick` | Quick dev flow — routes through dev context |
| `bmad_docs` | Returns rendered project documentation |
| `bmad_agents` | Agent roster with capabilities and project status |
| `bmad_flow` | Flow graph for selected track with live status |
| `bmad_parallel` | Analyzes/executes parallel independent tasks |
| `bmad_help` | Help queries via sampling in help context |
| `bmad_reset_context` | Manually reset a workflow's context window |
| `bmad_context_status` | Returns message counts per workflow context |

## Installation

### Via npx (from GitHub)

```json
{
  "mcpServers": {
    "bmad-app": {
      "command": "npx",
      "args": ["-y", "github:khaldoon-jabbar/bmad-app"]
    }
  }
}
```

### Remote (Vercel)

MCP endpoint: `https://bmad-app-eta.vercel.app/mcp`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| MCP Server | TypeScript + `@modelcontextprotocol/sdk` |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Flow Diagrams | React Flow + Dagre |
| Charts | Recharts |
| Build | Vite (single HTML bundle) |
| Package Manager | pnpm |

## Development

```bash
pnpm install
pnpm dev          # UI dev server
pnpm build        # Build UI (dist/ui/index.html)
pnpm build:server # Compile server (dist/server/)
```

## Project Structure

```
bmad-app/
├── src/
│   ├── server/
│   │   ├── index.ts              # MCP server entry
│   │   ├── context-manager.ts    # Persistent context windows per workflow
│   │   ├── tools/
│   │   │   ├── dashboard.ts      # Project state reader
│   │   │   ├── orchestrate.ts    # Skill invocation via sampling
│   │   │   ├── quick-mode.ts     # Quick dev flow
│   │   │   └── docs.ts           # Documentation viewer
│   │   └── parsers/              # BMad file parsers
│   ├── ui/
│   │   ├── App.tsx               # Root + routing
│   │   ├── views/
│   │   │   ├── Dashboard.tsx     # Home view
│   │   │   ├── SprintBoard.tsx   # Kanban board
│   │   │   ├── FlowDiagram.tsx   # Interactive flow
│   │   │   ├── AgentRoster.tsx   # Agent cards
│   │   │   ├── QuickMode.tsx     # Quick dev input
│   │   │   ├── DocsView.tsx      # Doc browser
│   │   │   ├── ParallelView.tsx  # Parallel execution
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── ToolResultPanel.tsx  # Displays sampling results
│   │   │   └── ...
│   │   └── hooks/
│   │       └── useApp.ts         # MCP App SDK integration
│   └── shared/
│       └── types.ts
├── api/
│   └── mcp.ts                    # Vercel serverless MCP endpoint
├── PRD.md
└── package.json
```

## License

MIT
