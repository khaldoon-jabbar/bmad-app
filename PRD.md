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
│   │   │   └── DocsView.tsx       # Project documentation
│   │   ├── components/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── PhaseIndicator.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   └── ActionButton.tsx
│   │   └── hooks/
│   │       └── useApp.ts         # MCP App SDK integration
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
│  │  • bmad_orchestrate → triggers BMad skills    │       │
│  │  • bmad_quick      → quick dev flow           │       │
│  │  • bmad_docs       → project documentation    │       │
│  └──────────────────────┬───────────────────────┘       │
│                         ↓                                │
│              BMad Skills (existing)                       │
│              • bmad-pm, bmad-architect, etc.             │
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

Triggers a BMad skill with correct context.

**Input:**
```json
{
  "skill": "bmad-pm | bmad-architect | bmad-agent-dev | bmad-ux-designer | bmad-analyst | bmad-tech-writer",
  "triggerCode": "CP | CA | CE | DS | CR | SP | QD | ...",
  "context": { "storySlug?": "string", "epicId?": "string" }
}
```
**Output:** `{ status: "triggered", message: string }`

### 9.3 `bmad_quick`

Quick mode — compressed intent-to-code.

**Input:** `{ intent: string }`
**Output:** Routes to `bmad-quick-dev` skill.

### 9.4 `bmad_docs`

Returns rendered project documentation.

**Input:** `{ document: "prd" | "architecture" | "ux" | "project-context" | "epic" | "story", id?: string }`
**Output:** `{ content: string, title: string }`

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Initial load** | < 500ms (single HTML bundle, no external fetches) |
| **Bundle size** | < 500KB gzipped |
| **Refresh latency** | < 200ms (local file reads) |
| **Min host width** | 320px |
| **Accessibility** | WCAG 2.1 AA (keyboard nav, screen reader labels) |
| **Offline** | App works without network (all data is local files) |

---

## 11. Implementation Plan

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

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| **Adoption** | Developer can go from `/bmad-app` to first story implementation without reading BMad docs |
| **Clarity** | Sprint progress visible in < 2 seconds after opening |
| **Correctness** | Phase gates prevent out-of-order actions 100% of the time |
| **Speed** | No action requires more than 2 clicks from dashboard |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP Apps spec changes | UI rendering breaks | Pin SDK version, monitor spec repo |
| BMad file format changes | Parsers break | Version-detect file format, graceful degradation |
| Host doesn't support MCP Apps | App can't render | Fallback to text-based tool output |
| iframe sandboxing limits | Can't access files directly | All file access through MCP server tools |
| BMad skills change trigger codes | Orchestration fails | Read trigger codes from BMad config, not hardcoded |

---

## 14. Open Questions

1. **Notification on skill completion** — Can the MCP host notify the app when a triggered skill finishes? If not, polling file changes is the fallback.
2. **Multi-project support** — Should the app support switching between multiple BMad projects? V1 targets single project.
3. **Collaborative use** — Should sprint board reflect real-time changes from multiple developers? Deferred to V2.

---

## 15. References

- [BMad Method Documentation](https://docs.bmad-method.org)
- [MCP Apps Overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps API](https://apps.extensions.modelcontextprotocol.io/api/)
- [MCP App SDK](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)
