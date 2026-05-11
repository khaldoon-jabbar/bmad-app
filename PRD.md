# BMad App — Product Requirements Document

## 1. Product Overview

**BMad App** is an MCP App that provides a visual, interactive dashboard for managing projects driven by the [BMad Method](https://docs.bmad-method.org). It renders inline inside MCP hosts (Claude Desktop, VS Code Copilot, etc.) as a sandboxed iframe, giving developers a clear visual interface to orchestrate BMad workflows without memorizing agent names, trigger codes, or file structures.

**Trigger:** `/bmad-app`

**Core value proposition:** Make BMad Method accessible to developers who want visual feedback, guided orchestration, and at-a-glance project status — while the actual work is done by BMad skills/agents.

---

## 2. Problem Statement

The BMad Method is powerful but text-heavy. Developers must:

- Remember 6 agents, ~20 trigger codes, and the correct phase ordering
- Manually track sprint status by reading YAML files
- Know which documents feed into which workflows
- Start fresh chats per workflow (easy to forget)
- Parse epic/story files to understand progress

This friction discourages adoption. A visual layer that **orchestrates** the method and **displays** project state solves this without changing how BMad works underneath.

---

## 3. Target Users

| Persona | Need |
|---------|------|
| **Solo developer** | Guided workflow through BMad phases, progress visibility |
| **Tech lead** | Sprint dashboard, epic/story status overview |
| **New BMad adopter** | Discoverability — see what's possible without reading docs |

---

## 4. Architecture

### 4.1 MCP App Structure

```
bmad-app/
├── src/
│   ├── server/              # MCP server (Node.js/TypeScript)
│   │   ├── index.ts         # MCP server entry, tool + resource registration
│   │   ├── context-manager.ts # Persistent context windows per workflow
│   │   ├── tools/           # Tool handlers
│   │   │   ├── dashboard.ts       # Read sprint-status.yaml, epics, stories
│   │   │   ├── orchestrate.ts     # Trigger BMad skills with correct context
│   │   │   ├── quick-mode.ts      # Quick dev flow
│   │   │   └── docs.ts            # Project documentation viewer
│   │   └── parsers/         # Parse BMad output files
│   │       ├── sprint.ts          # Parse sprint-status.yaml
│   │       ├── epics.ts           # Parse epic markdown files
│   │       └── stories.ts         # Parse story markdown files
│   ├── ui/                  # Frontend (React + Tailwind)
│   │   ├── index.html       # Entry point
│   │   ├── App.tsx          # Root component
│   │   ├── views/
│   │   │   ├── Dashboard.tsx      # Main dashboard view
│   │   │   ├── PhaseView.tsx      # Phase navigation + status
│   │   │   ├── SprintBoard.tsx    # Kanban-style sprint view
│   │   │   ├── EpicDetail.tsx     # Epic drill-down
│   │   │   ├── StoryDetail.tsx    # Story detail + actions
│   │   │   ├── QuickMode.tsx      # Quick dev interface
│   │   │   ├── DocsView.tsx       # Project documentation browser
│   │   │   ├── AgentRoster.tsx    # All 6 agents + capabilities
│   │   │   ├── FlowDiagram.tsx    # Interactive BMad flow diagram
│   │   │   └── ParallelView.tsx   # Parallel execution UI
│   │   ├── components/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── PhaseIndicator.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── ActionButton.tsx
│   │   │   └── ToolResultPanel.tsx  # Dismissible modal showing sampling results
│   │   └── hooks/
│   │       └── useApp.ts         # MCP App SDK integration + callToolWithResult
│   └── shared/
│       └── types.ts         # Shared types
├── package.json
├── tsconfig.json
├── vite.config.ts           # Build UI bundle
└── README.md
```

### 4.2 Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│  MCP Host (Claude Desktop / VS Code Copilot)            │
│                                                         │
│  User: /bmad-app                                        │
│       ↓                                                 │
│  ┌──────────────────────────────────────────────┐       │
│  │  BMad App (sandboxed iframe)                  │       │
│  │                                               │       │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │       │
│  │  │Dashboard│  │Sprint    │  │Quick Mode  │  │       │
│  │  │  View   │  │Board     │  │            │  │       │
│  │  └────┬────┘  └────┬─────┘  └─────┬──────┘  │       │
│  │       │             │              │          │       │
│  │       └─────────────┴──────────────┘          │       │
│  │                     │ postMessage (JSON-RPC)  │       │
│  └─────────────────────┼────────────────────────┘       │
│                        ↓                                 │
│  ┌──────────────────────────────────────────────┐       │
│  │  BMad App MCP Server                          │       │
│  │                                               │       │
│  │  Tools:                                       │       │
│  │  • bmad_dashboard  → reads project files      │       │
│  │  • bmad_orchestrate → sampling (sub-agent)    │       │
│  │  • bmad_quick      → sampling (dev context)   │       │
│  │  • bmad_docs       → project documentation    │       │
│  │  • bmad_help       → sampling (help context)  │       │
│  │                                               │       │
│  │  Context Manager:                             │       │
│  │  • pm context   (accumulated messages)        │       │
│  │  • arch context (accumulated messages)        │       │
│  │  • dev context  (accumulated messages)        │       │
│  │  • help context (accumulated messages)        │       │
│  └──────────────────────┬───────────────────────┘       │
│                         │ createMessage (sampling)       │
│                         ↓                                │
│              Host LLM (sub-agent turn)                   │
│              ↕ Runs BMad skill in fresh context          │
│              Returns result to server                    │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Data Flow

The app is a **read + orchestrate** layer. It does NOT duplicate BMad logic:

1. **Read:** Parses `_bmad-output/` files (sprint-status.yaml, epics/, stories/, PRD.md, architecture.md)
2. **Display:** Renders parsed data as visual dashboard
3. **Orchestrate:** When user clicks an action, the server triggers the appropriate BMad skill with correct context loading
4. **Refresh:** After a skill completes, the app re-reads files to update the view

---

## 5. Features

### 5.1 Dashboard View (Home)

The landing view after `/bmad-app`. Shows:

| Element | Description |
|---------|-------------|
| **Phase Indicator** | 4-step progress bar showing Analysis → Planning → Solutioning → Implementation. Current phase highlighted. Clickable to navigate. |
| **Project Summary** | Project name, track (Quick/BMad/Enterprise), creation date |
| **Sprint Overview** | Current sprint progress bar (stories done / total), velocity if available |
| **Epic Cards** | Grid of epics with: name, story count, completion %, status badge |
| **Recent Activity** | Last 5 actions taken (story completed, review passed, etc.) |
| **Quick Actions** | Prominent buttons for the most common next action based on current state |

**Smart Next Action:** The dashboard infers what to do next:
- No PRD → "Create PRD" button (triggers `bmad-pm` with `CP`)
- PRD exists, no architecture → "Create Architecture" (triggers `bmad-architect` with `CA`)
- Architecture exists, no epics → "Create Epics & Stories" (triggers `bmad-pm` with `CE`)
- Epics exist, no sprint → "Start Sprint Planning" (triggers `bmad-agent-dev` with `SP`)
- Sprint active → "Pick Next Story" (shows unstarted stories)

### 5.2 Phase View

Full-screen view of a single phase with:

- Phase description and purpose
- Required/produced documents with status (✅ exists, ⏳ in progress, ❌ missing)
- Available agent actions for this phase
- Document preview (rendered markdown)

### 5.3 Sprint Board

Kanban-style board with columns:

| Draft | In Progress | Review | Done |
|-------|-------------|--------|------|

Each card shows:
- Story title and slug
- Parent epic (color-coded)
- Acceptance criteria count (checked/total)
- Action buttons: "Create Story File", "Dev Story", "Code Review"

**Epic filter** — toggle visibility by epic.
**Progress bar** per epic and overall.

### 5.4 Epic Detail View

Drill into an epic:
- Epic description (from epic markdown file)
- Story list with statuses
- Dependency graph (if stories have dependencies)
- Completion percentage with progress bar
- Actions: "Create Next Story", "Run Retrospective"

### 5.5 Story Detail View

Single story view:
- Full story content (rendered from `story-[slug].md`)
- Acceptance criteria checklist
- Status badge + transition buttons
- Actions: "Dev Story" → triggers `bmad-agent-dev` with `DS`, "Code Review" → triggers with `CR`

### 5.6 Quick Mode

Simplified interface for small tasks (Quick Flow track):
- Text input: describe what you want to do
- "Go" button → triggers `bmad-quick-dev`
- Shows result inline when complete

### 5.7 Documentation View

Browse project documents:
- PRD.md (rendered)
- architecture.md (rendered)
- UX spec (rendered)
- project-context.md (rendered)
- Any custom docs from `_bmad-output/`

Searchable and navigable.

### 5.8 Generate Documentation (Optional Action)

An optional action the user can choose to trigger: invoke **📚 Paige (Tech Writer)** via `bmad-tech-writer` to generate or update project documentation. Available as an action button — not part of the mandatory flow. Supports:

- "Document Project" — full project documentation pass
- "Write Document" — generate a specific document
- "Validate Doc" — check an existing document for completeness

### 5.9 Agent Roster View

A dedicated view showing **all 6 BMad agents** with:

| Element | Description |
|---------|-------------|
| **Agent Card** | Avatar emoji, name, role, skill ID, which phase they belong to |
| **Capabilities** | List of trigger codes and what each does (e.g. John → CP: Create PRD, CE: Create Epics) |
| **Status** | Whether this agent's outputs exist in the project (e.g. Winston shows ✅ if architecture.md exists) |
| **Launch** | Click any capability to trigger that workflow directly |

Agents shown:
- 📊 **Mary** — Analyst (Phase 1: Analysis)
- 📚 **Paige** — Tech Writer (Phase 1: Analysis)
- 📋 **John** — Product Manager (Phase 2: Planning)
- 🎨 **Sally** — UX Designer (Phase 2: Planning)
- 🏗️ **Winston** — Architect (Phase 3: Solutioning)
- 💻 **Amelia** — Developer (Phase 4: Implementation)

### 5.10 Interactive Flow Diagram

A visual, interactive diagram of the entire BMad Method flow:

- **Phase-level view:** Four phases as a horizontal pipeline, showing the progressive context chain (each phase's outputs feed into the next)
- **Workflow-level view:** Drill into any phase to see the specific workflows, their inputs/outputs, and which agent runs them
- **Live state overlay:** Nodes are colored by status (done/active/pending) based on actual project state — the diagram is alive, not static
- **Click-to-act:** Click any workflow node to trigger it (with phase gate validation)
- **Dependency arrows:** Show which documents feed into which workflows (PRD → Architecture → Epics → Sprint)
- **Track selector:** Toggle between Quick Flow / BMad Method / Enterprise tracks to see how the flow differs

```
Example flow (BMad Method track):

┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────────┐
│ Analysis │───▶│ Planning │───▶│ Solutioning  │───▶│Implementation  │
│ (Mary,   │    │ (John,   │    │ (Winston)    │    │ (Amelia)       │
│  Paige)  │    │  Sally)  │    │              │    │                │
└──────────┘    └──────────┘    └──────────────┘    └────────────────┘
     │               │               │                     │
   Brief           PRD.md      architecture.md       sprint-status
   PRFAQ          UX spec      epics/ + stories/     story files
                                                     code + tests
```

The diagram is rendered with an interactive library (e.g. React Flow / Dagre) — nodes are draggable, zoomable, and clickable.

### 5.11 Parallel Execution

The app supports **parallel execution** of independent tasks:

**Dependency analysis:** When displaying stories or workflows, the app analyzes dependencies and identifies tasks that can run concurrently.

**Parallel triggers:**
- Stories within the same epic that have no inter-dependencies can be started in parallel (each in its own fresh chat per BMad rules)
- Independent epics can be worked on simultaneously
- Phase 2 workflows can run in parallel: PRD creation and UX design can happen concurrently
- Code reviews can run in parallel with new story development

**Visual indicators:**
- Stories/tasks that *can* run in parallel get a "⚡ Parallelizable" badge
- A "Run Parallel" button appears when 2+ independent tasks are available
- Active parallel tasks shown as a split progress view
- Dependency graph highlights the critical path vs. parallelizable branches

**Constraints enforced:**
- Phase gates still apply — can't parallelize across phase boundaries
- Each parallel task gets its own fresh chat context (BMad requirement)
- User can set max concurrency (default: 2 parallel tasks)

---

## 6. Orchestration Logic

The app knows the BMad flow and enforces it:

### 6.1 Phase Gate Checks

Before allowing an action, the app validates prerequisites:

```
Create Architecture → requires PRD.md ✅
Create Epics       → requires PRD.md + architecture.md ✅
Sprint Planning    → requires epics/ with stories ✅
Dev Story          → requires story file created ✅
```

If prerequisites are missing, the app shows what's needed and offers to create it.

### 6.2 Skill Invocation

When triggering a BMad skill, the app:

1. Identifies the correct skill ID (e.g., `bmad-pm`, `bmad-architect`)
2. Sends a message to the MCP host to invoke the skill with the right trigger code
3. The host runs the skill in a new context (fresh chat — BMad requirement)
4. On completion, the app refreshes its data from the output files

### 6.3 State Detection

On load and refresh, the app reads the filesystem to determine project state:

```typescript
interface ProjectState {
  track: 'quick' | 'bmad' | 'enterprise' | null;
  phase: 'analysis' | 'planning' | 'solutioning' | 'implementation' | null;
  documents: {
    prd: boolean;
    architecture: boolean;
    uxSpec: boolean;
    projectContext: boolean;
  };
  epics: Epic[];
  sprint: SprintStatus | null;
  config: BmadConfig | null;
}
```

---

## 7. UI/UX Design Principles

1. **Dark theme default** — matches IDE environments (VS Code, Cursor)
2. **Information density** — show as much as possible without scrolling; progressive disclosure for details
3. **Action-oriented** — every view has a clear "what to do next" call-to-action
4. **Non-blocking** — long operations show progress, app remains interactive
5. **Responsive** — works in narrow side panels (min 320px) and wide views
6. **Familiar patterns** — Kanban board, progress bars, status badges — no novel UI concepts to learn

### Color System

| Color | Meaning |
|-------|---------|
| Blue | Current / Active |
| Green | Done / Pass |
| Yellow | In Progress / Warning |
| Red | Blocked / Failed |
| Gray | Not Started / Inactive |

### Agent Avatars

Each BMad agent gets a recognizable icon:
- 📊 Mary (Analyst)
- 📚 Paige (Tech Writer)
- 📋 John (Product Manager)
- 🎨 Sally (UX Designer)
- 🏗️ Winston (Architect)
- 💻 Amelia (Developer)

---

## 8. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **MCP Server** | TypeScript + `@modelcontextprotocol/sdk` | Standard MCP server, strong typing |
| **UI Framework** | React 19 + TypeScript | Ecosystem, hooks for MCP App SDK |
| **Styling** | Tailwind CSS 4 | Utility-first, dark theme, small bundle |
| **Charts** | Recharts or lightweight SVG | Progress bars, burndown charts |
| **Flow Diagrams** | React Flow + Dagre | Interactive workflow/dependency graphs |
| **Markdown** | react-markdown + remark-gfm | Render BMad documents |
| **Build** | Vite | Fast builds, single HTML bundle output |
| **MCP App SDK** | `@modelcontextprotocol/ext-apps` | Official SDK for iframe communication |
| **YAML Parser** | js-yaml | Parse sprint-status.yaml |

---

## 9. MCP Server Tools

### 9.1 `bmad_dashboard`

Returns full project state for the dashboard view.

**Input:** `{ projectPath?: string }`
**Output:** `ProjectState` object (see §6.3)
**UI Resource:** `ui://bmad-app/dashboard`

### 9.2 `bmad_orchestrate`

Triggers a BMad skill via **MCP Sampling** (`createMessage`). The server delegates to the host LLM as a sub-agent, maintaining a persistent context window per workflow.

**Input:**
```json
{
  "skill": "bmad-pm | bmad-architect | bmad-agent-dev | bmad-ux-designer | bmad-analyst | bmad-tech-writer",
  "triggerCode": "CP | CA | CE | DS | CR | SP | QD | ...",
  "context": { "storySlug?": "string", "epicId?": "string" }
}
```
**Output:** `{ status: "completed", result: string }` — The actual LLM response from the sub-agent.

**Sampling behavior:**
- Maps skill → workflow ID (`bmad-pm`→`pm`, `bmad-architect`→`arch`, `bmad-agent-dev`→`dev`)
- Each workflow maintains its own context window (accumulated messages)
- Subsequent calls within the same workflow share context (follow-up awareness)
- Context auto-resets when response contains `[NEW_CONTEXT]` marker
- `initialize-bmad` always gets a fresh context (one-shot)

### 9.3 `bmad_quick`

Quick mode — compressed intent-to-code. Routes through the `dev` context window via sampling.

**Input:** `{ intent: string }`
**Output:** LLM response from sub-agent (routed through dev context).

### 9.4 `bmad_docs`

Returns rendered project documentation.

**Input:** `{ document: "prd" | "architecture" | "ux" | "project-context" | "epic" | "story", id?: string }`
**Output:** `{ content: string, title: string }`

### 9.5 `bmad_agents`

Returns the full agent roster with capabilities and project status.

**Input:** `{ projectPath?: string }`
**Output:** Array of agent objects with name, role, phase, trigger codes, and output status.

### 9.6 `bmad_flow`

Returns the BMad flow graph for the selected track.

**Input:** `{ track: "quick" | "bmad" | "enterprise", projectPath?: string }`
**Output:** Flow graph with nodes (workflows), edges (dependencies), and live status per node.

### 9.7 `bmad_parallel`

Analyzes and triggers parallel execution of independent tasks.

**Input:**
```json
{
  "action": "analyze" | "execute",
  "tasks?": [{ "skill": "string", "triggerCode": "string", "context": {} }],
  "maxConcurrency?": 2
}
```
**Output:**
- `analyze`: Returns parallelizable task groups with dependency info
- `execute`: Triggers tasks in parallel, returns status handles for tracking

### 9.8 `bmad_help`

Help queries routed through the persistent `help` context window via sampling.

**Input:** `{ question: string }`
**Output:** LLM response with BMad method guidance. Context accumulates for follow-up questions.

### 9.9 `bmad_reset_context`

Manually reset a workflow's context window (start fresh conversation).

**Input:** `{ workflow: "help" | "dev" | "pm" | "arch" | "all" }`
**Output:** `{ status: "reset", workflow: string, previousMessages: number }`

### 9.10 `bmad_context_status`

Returns the current state of all context windows.

**Input:** `{}`
**Output:** `{ contexts: { [workflowId]: { messageCount: number, lastActivity: timestamp } } }`

---

## 10. Context Window Architecture

Each BMad workflow maintains its own persistent context window (in-memory message history). This follows BMad's recommendation that each workflow should have its own context.

### 10.1 Context Manager

```typescript
// Singleton managing all workflow contexts
class ContextManager {
  private contexts: Map<WorkflowId, ContextWindow>;

  sample(workflowId: string, prompt: string): Promise<string> {
    // 1. Get or create context for this workflow
    // 2. Append user message to history
    // 3. Send FULL history to createMessage (sampling)
    // 4. Append assistant response to history
    // 5. Check for [NEW_CONTEXT] marker → auto-reset
    // 6. Return response text
  }

  reset(workflowId: string): void;
  status(): Map<string, { messageCount: number }>;
}
```

### 10.2 Workflow → Context Mapping

| Workflow | Context ID | Behavior |
|----------|-----------|----------|
| bmad-pm | `pm` | Accumulates project management context |
| bmad-architect | `arch` | Accumulates architecture decisions |
| bmad-agent-dev | `dev` | Accumulates dev work (stories, reviews) |
| bmad-help | `help` | Accumulates help Q&A |
| bmad-quick | `dev` | Shares dev context |
| initialize-bmad | `init` | Always fresh (one-shot) |

### 10.3 Context Lifecycle

1. **Created** on first tool call for a workflow
2. **Accumulates** messages across multiple tool calls
3. **Auto-resets** when LLM response contains `[NEW_CONTEXT]`
4. **Manually reset** via `bmad_reset_context` tool or UI button
5. **Lost** on server restart (in-memory, acceptable for stdio transport)

### 10.4 UI Indicators

- Message count badge on each workflow view
- "New Chat" / "Reset Context" button per view
- Visual indicator when context is getting large (>20 messages)

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Initial load** | < 500ms (single HTML bundle, no external fetches) |
| **Bundle size** | < 500KB gzipped |
| **Refresh latency** | < 200ms (local file reads) |
| **Min host width** | 320px |
| **Accessibility** | WCAG 2.1 AA (keyboard nav, screen reader labels) |
| **Offline** | App works without network (all data is local files) |

---

## 12. Implementation Plan

### Phase 1 — Foundation (Epic 1)
- MCP server scaffold with tool registration
- File parsers for sprint-status.yaml, epics, stories
- Basic dashboard UI with project state detection
- Phase indicator component

### Phase 2 — Sprint Board (Epic 2)
- Kanban board view
- Story cards with status transitions
- Epic filtering
- Progress bars (per-epic + overall)

### Phase 3 — Orchestration (Epic 3)
- Skill invocation via MCP host messaging
- Phase gate validation
- Smart next-action suggestions
- Action confirmation dialogs

### Phase 4 — Detail Views (Epic 4)
- Epic detail view with story list
- Story detail view with acceptance criteria
- Document viewer with markdown rendering
- Search across documents

### Phase 5 — Quick Mode + Polish (Epic 5)
- Quick mode interface
- Agent avatars and polish
- Responsive layout for narrow panels
- Error handling and empty states

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| **Adoption** | Developer can go from `/bmad-app` to first story implementation without reading BMad docs |
| **Clarity** | Sprint progress visible in < 2 seconds after opening |
| **Correctness** | Phase gates prevent out-of-order actions 100% of the time |
| **Speed** | No action requires more than 2 clicks from dashboard |

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP Apps spec changes | UI rendering breaks | Pin SDK version, monitor spec repo |
| BMad file format changes | Parsers break | Version-detect file format, graceful degradation |
| Host doesn't support MCP Apps | App can't render | Fallback to text-based tool output |
| iframe sandboxing limits | Can't access files directly | All file access through MCP server tools |
| BMad skills change trigger codes | Orchestration fails | Read trigger codes from BMad config, not hardcoded |

---

## 15. Open Questions

1. **Notification on skill completion** — Can the MCP host notify the app when a triggered skill finishes? If not, polling file changes is the fallback.
2. **Multi-project support** — Should the app support switching between multiple BMad projects? V1 targets single project.
3. **Collaborative use** — Should sprint board reflect real-time changes from multiple developers? Deferred to V2.

---

## 16. References

- [BMad Method Documentation](https://docs.bmad-method.org)
- [MCP Apps Overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps API](https://apps.extensions.modelcontextprotocol.io/api/)
- [MCP App SDK](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)
