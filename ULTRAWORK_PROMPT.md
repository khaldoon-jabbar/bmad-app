# BMad App — Ultrawork Prompt for Sisyphus

Use this as the `/ulw-loop` prompt in OpenCode to build the entire BMad App.

---

## Prompt

```
You are building BMad App — an MCP App that visually manages BMad Method projects. The full PRD is in PRD.md — read it first, it is your single source of truth.

## What You're Building

An MCP server (TypeScript) + React UI (sandboxed iframe) that:
1. Reads BMad project files (_bmad-output/) and displays sprint status, epics, stories, phases
2. Provides an interactive flow diagram of the BMad Method (React Flow + Dagre)
3. Shows all 6 BMad agents with their capabilities and lets users trigger workflows
4. Orchestrates BMad skills — the app handles flow/gates, skills do the actual work
5. Supports parallel execution of independent tasks
6. Has a Quick Mode for small tasks (bmad-quick-dev)

## Tech Stack (mandatory)

- TypeScript strict mode throughout
- MCP server: @modelcontextprotocol/sdk + @modelcontextprotocol/ext-apps/server
- UI: React 19 + @modelcontextprotocol/ext-apps/react
- Styling: Tailwind CSS 4, dark theme default
- Flow diagrams: @xyflow/react (React Flow v12) + @dagrejs/dagre
- Charts: recharts
- Markdown: react-markdown + remark-gfm
- YAML: js-yaml
- Build: Vite (single HTML bundle output via vite-plugin-singlefile)
- Package manager: pnpm

## Architecture Rules

- src/server/ = MCP server entry + tool handlers + file parsers
- src/ui/ = React app (views, components, hooks, overlays)
- src/shared/ = TypeScript types shared between server and UI
- Communication: UI ↔ Server via postMessage JSON-RPC (MCP App SDK handles this)
- The UI is a resource registered at ui://bmad-app/dashboard
- Each tool declares _meta.ui.resourceUri pointing to the UI resource
- All file reads go through MCP server tools, UI never touches filesystem directly

## Implementation Order

Follow this order strictly. Complete and verify each phase before moving on.

### PHASE 1: Project Setup & MCP Server
1. Initialize pnpm project with all dependencies
2. Configure TypeScript (strict, paths aliases)
3. Configure Vite for single-file HTML bundle output
4. Configure Tailwind CSS 4 with dark theme
5. Implement src/shared/types.ts — all interfaces from PRD §6.3 plus:
   - Epic, Story, StoryStatus, Agent, TriggerCode, FlowNode, FlowEdge
   - ParallelTaskGroup, PhaseGateResult
6. Implement src/server/parsers/:
   - sprint.ts: parse sprint-status.yaml → SprintStatus
   - epics.ts: parse _bmad-output/planning-artifacts/epics/*.md → Epic[]
   - stories.ts: parse story-*.md files → Story[]
7. Implement src/server/tools/:
   - dashboard.ts: bmad_dashboard tool — reads all project files, returns ProjectState
   - orchestrate.ts: bmad_orchestrate tool — validates phase gates, returns skill invocation payload
   - quick-mode.ts: bmad_quick tool — routes intent to bmad-quick-dev
   - docs.ts: bmad_docs tool — reads and returns markdown documents
   - agents.ts: bmad_agents tool — returns agent roster with project output status
   - flow.ts: bmad_flow tool — returns flow graph for selected track (quick/bmad/enterprise)
   - parallel.ts: bmad_parallel tool — analyzes dependencies, identifies parallelizable tasks
8. Implement src/server/index.ts:
   - Register all 7 tools with MCP SDK
   - Register UI resource at ui://bmad-app/dashboard
   - Set _meta.ui.resourceUri on tools that render UI
   - Handle stdio transport

### PHASE 2: UI Foundation
1. Implement src/ui/index.html — minimal HTML entry
2. Implement src/ui/hooks/useApp.ts — MCP App SDK connection (useApp, useHostStyles)
3. Implement src/ui/App.tsx — router with navigation between views
4. Implement src/ui/components/:
   - ProgressBar.tsx: animated, color-coded by status
   - PhaseIndicator.tsx: 4-step horizontal indicator with clickable phases
   - StatusBadge.tsx: colored badges (draft/in-progress/review/done/blocked)
   - AgentCard.tsx: agent avatar + name + role + phase + action buttons
   - ActionButton.tsx: primary/secondary action buttons with loading states

### PHASE 3: Dashboard & Phase Views
1. Implement Dashboard.tsx:
   - PhaseIndicator at top
   - Project summary card (name, track, date)
   - Sprint progress bar (done/total stories)
   - Epic cards grid with completion % and status
   - Smart Next Action button (infer from project state per PRD §5.1)
   - Recent activity feed
2. Implement PhaseView.tsx:
   - Phase description and purpose text
   - Document status grid (✅/⏳/❌ for each required doc)
   - Available agent actions for the phase
   - Inline document preview (rendered markdown)

### PHASE 4: Sprint Board & Story Management
1. Implement SprintBoard.tsx:
   - 4-column Kanban: Draft | In Progress | Review | Done
   - Drag-and-drop story cards between columns
   - Cards show: title, epic color, AC count, action buttons
   - Epic filter toggles
   - Per-epic and overall progress bars
2. Implement EpicDetail.tsx:
   - Epic description (rendered markdown)
   - Story list with statuses
   - Dependency graph (React Flow mini-diagram)
   - Completion progress bar
   - Actions: Create Next Story, Run Retrospective
3. Implement StoryDetail.tsx:
   - Full story content (rendered markdown)
   - Acceptance criteria as interactive checklist
   - Status badge with transition buttons
   - Dev Story / Code Review action buttons

### PHASE 5: Agent Roster & Flow Diagram
1. Implement AgentRoster.tsx:
   - Grid of 6 agent cards (📊 Mary, 📚 Paige, 📋 John, 🎨 Sally, 🏗️ Winston, 💻 Amelia)
   - Each card: avatar, name, role, skill ID, phase badge
   - Expandable capability list with trigger codes
   - Output status indicator (✅ if agent's outputs exist)
   - Launch button per capability
2. Implement FlowDiagram.tsx:
   - React Flow canvas with Dagre auto-layout
   - Phase-level nodes: Analysis → Planning → Solutioning → Implementation
   - Drill-down: click phase to expand into workflow nodes
   - Live coloring: green=done, blue=active, yellow=in-progress, gray=pending
   - Click workflow node → trigger with phase gate check
   - Dependency edges with arrows
   - Track selector tabs: Quick Flow | BMad Method | Enterprise
   - Zoom, pan, minimap

### PHASE 6: Quick Mode, Docs, Parallel Execution
1. Implement QuickMode.tsx:
   - Clean text input with placeholder "Describe what you want to do..."
   - "Go" button → calls bmad_quick tool
   - Result display area (rendered markdown)
   - Loading state with progress indicator
2. Implement DocsView.tsx:
   - Document list sidebar (PRD, Architecture, UX, Project Context)
   - Rendered markdown content area
   - Search bar with full-text search across docs
3. Add Generate Documentation action button (triggers bmad-tech-writer):
   - Document Project, Write Document, Validate Doc options
4. Implement parallel execution UI:
   - ⚡ Parallelizable badges on independent stories/tasks
   - "Run Parallel" button when 2+ independent tasks available
   - Split progress view for active parallel tasks
   - Max concurrency selector (default: 2)

### PHASE 7: Polish & Verification
1. Dark theme consistency pass — every component uses Tailwind dark classes
2. Responsive layout — test at 320px, 768px, 1200px widths
3. Empty states — meaningful messages when no project, no sprint, no epics
4. Error handling — graceful failures with retry options
5. Loading states — skeleton screens while data loads
6. Keyboard navigation — Tab through all interactive elements
7. Build verification:
   - `pnpm build` succeeds
   - Output is a single HTML file (check dist/)
   - `pnpm lint` passes (if configured)
   - TypeScript strict mode — zero type errors

## File Parsing Specifications

### sprint-status.yaml
```yaml
sprint:
  number: 1
  status: active
  started: 2025-01-15
epics:
  - id: epic-1
    title: "Foundation"
    status: in-progress
    stories:
      - slug: setup-project
        title: "Setup Project"
        status: done
      - slug: add-auth
        title: "Add Authentication"
        status: in-progress
```

### Epic markdown files (_bmad-output/planning-artifacts/epics/epic-*.md)
Parse frontmatter (YAML between ---) for metadata, body for description. Extract story references.

### Story files (story-*.md)
Parse frontmatter for status, epic reference, acceptance criteria. Body is implementation spec.

## Critical Constraints

- The UI runs in a sandboxed iframe — NO direct filesystem access, NO fetch to external URLs unless CSP allows it
- ALL data flows through MCP server tools via postMessage JSON-RPC
- Each BMad skill invocation MUST happen in a fresh chat context (the app sends a message to the host, not runs the skill itself)
- Phase gates are HARD requirements — the app must block out-of-order actions
- The app is a read + orchestrate layer — it NEVER duplicates BMad logic

## Completion Criteria

The app is DONE when:
1. `pnpm build` produces a single HTML bundle in dist/
2. MCP server starts and registers all 7 tools + UI resource
3. All 9 views render with mock data (Dashboard, PhaseView, SprintBoard, EpicDetail, StoryDetail, QuickMode, DocsView, AgentRoster, FlowDiagram)
4. Flow diagram shows all 3 tracks with interactive nodes
5. Sprint board has working Kanban columns
6. Agent roster shows all 6 agents with capabilities
7. Phase gates block invalid actions
8. Parallel execution analysis identifies independent tasks
9. TypeScript compiles with zero errors in strict mode
10. Dark theme applied consistently

When ALL criteria are met, output: DONE
```
