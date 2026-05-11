# BMad App v2 — Ultrawork Prompt for Sisyphus

Use this as the `/ulw-loop` prompt in OpenCode to rebuild BMad App with new requirements.

---

## Prompt

```
You are rebuilding BMad App — an MCP App that visually manages BMad Method projects. Read PRD.md for existing context, but THIS PROMPT overrides it where they conflict.

## New Requirements (v2)

The app must support these 4 capabilities that the current version lacks:

### 1. Init BMAD on a New Project
- A first-run "Init Project" flow when no `_bmad-output/` directory exists
- UI shows a welcome screen with a big "Initialize BMad" button
- Clicking it calls `bmad_orchestrate` with skill `/bmad-product-brief` (the entry point)
- After init, the dashboard refreshes and shows normal project state
- The init flow should also offer track selection: Quick | Standard BMad | Enterprise

### 2. Chat with bmad-help
- A persistent "BMad Help" chat panel (slide-out drawer or dedicated view)
- User types a question → app calls `bmad_orchestrate` with skill `/bmad-help` and the user's question as context
- Responses rendered as markdown in a chat-style interface
- Maintains conversation history within the session
- Accessible from every view via a floating help button (❓)

### 3. Model Selection for Reviews
- When triggering review/validation actions (code review, doc review, architecture review), show a model picker dropdown
- Options: "Default", "Claude Opus", "Claude Sonnet", "GPT-4o", "Custom"
- The selected model is passed as metadata in the `bmad_orchestrate` call (via a `preferredModel` field)
- The MCP host decides whether to honor it — the app just passes the preference
- Store last-used model preference in localStorage

### 4. Dashboard Buttons → BMad Skill Calls
- Every clickable action on the dashboard MUST map to a specific BMad skill call
- No decorative buttons — if it's clickable, it triggers a skill
- Button mapping (update existing + add missing):

| Button/Action | Skill Call |
|---|---|
| Initialize Project | `/bmad-product-brief` |
| Get Help | `/bmad-help` |
| Create PRD | `/bmad-product-brief` |
| Define Architecture | `/bmad-arch` |
| Create UX Design | `/bmad-ux` |
| Plan Sprint | `/bmad-sprint-plan` |
| Create Story | `/bmad-story` |
| Start Dev Story | `/bmad-dev-story` |
| Code Review | `/bmad-code-review` |
| Quick Dev | `/bmad-quick-dev` |
| Generate Docs | `/bmad-tech-writer` |
| Run Retrospective | `/bmad-retro` |
| Validate Phase Gate | `/bmad-gate-check` |

- The flow diagram nodes should ALSO trigger their corresponding skill when clicked
- Agent roster "Launch" buttons must map to the agent's primary skill

## What Already Exists

The current app has:
- MCP server with 7 tools (dashboard, orchestrate, quick-mode, docs, agents, flow, parallel)
- React UI with 10 views (Dashboard, PhaseView, SprintBoard, EpicDetail, StoryDetail, QuickMode, DocsView, AgentRoster, FlowDiagram, ParallelView)
- React Flow diagram, sprint board, agent cards
- Dark theme, Tailwind CSS 4

## Changes Required

### Server Changes (src/server/)
1. Update `orchestrate.ts` to accept `preferredModel` parameter (string, optional)
2. Update `bmad_orchestrate` tool schema in `index.ts` to include `preferredModel` in inputSchema
3. Add a new tool `bmad_help` that wraps `/bmad-help` skill with conversational context
4. Update `dashboard.ts` to detect "no project" state (no _bmad-output/) and return `{ initialized: false }` in that case

### UI Changes (src/ui/)
1. **New: InitView.tsx** — Welcome screen with track selection + "Initialize BMad" button
2. **New: HelpChat.tsx** — Slide-out chat drawer for `/bmad-help` conversations
3. **Update: App.tsx** — Add init detection (if `projectState.initialized === false`, show InitView), add floating help button, add HelpChat drawer
4. **Update: Dashboard.tsx** — Replace any informational buttons with skill-triggering ActionButtons. Every button must call `callTool('bmad_orchestrate', { skill, triggerCode, ... })`
5. **Update: FlowDiagram.tsx** — Node click → `callTool('bmad_orchestrate', { skill: nodeSkill, triggerCode: nodeTrigger })`
6. **Update: AgentRoster.tsx** — Launch button → `callTool('bmad_orchestrate', { skill: agent.primarySkill })`
7. **New: components/ModelPicker.tsx** — Dropdown for model selection, reads/writes localStorage
8. **New: components/HelpButton.tsx** — Floating ❓ button that toggles HelpChat drawer
9. **Update: StoryDetail.tsx** — "Code Review" button passes `preferredModel` from ModelPicker
10. **Update: PhaseView.tsx** — All phase action buttons must map to specific skills

### Shared Changes (src/shared/types.ts)
- Add `initialized: boolean` to ProjectState
- Add `preferredModel?: string` to OrchestrationRequest or equivalent
- Add `HelpMessage` type: `{ role: 'user' | 'assistant'; content: string; timestamp: number }`

## Tech Stack (same as v1)

- TypeScript strict mode
- MCP server: @modelcontextprotocol/sdk + @modelcontextprotocol/ext-apps/server
- UI: React 19 + @modelcontextprotocol/ext-apps/react
- Tailwind CSS 4, dark theme
- React Flow v12 + Dagre
- Recharts
- Vite + vite-plugin-singlefile (single HTML bundle)
- pnpm

## Implementation Order

### PHASE 1: Server Updates
1. Add `initialized` field to dashboard state (check for _bmad-output/ existence)
2. Add `preferredModel` to orchestrate tool schema
3. Add `bmad_help` tool — accepts `{ message: string, history?: HelpMessage[] }`, returns assistant response
4. Update shared types

### PHASE 2: Init Flow
1. Create InitView.tsx — welcome screen, track selector (Quick/Standard/Enterprise), "Initialize" button
2. Update App.tsx — check `projectState?.initialized`, route to InitView if false
3. Init button calls `bmad_orchestrate({ skill: '/bmad-product-brief', triggerCode: 'init' })`
4. After success, refresh dashboard state

### PHASE 3: Help Chat
1. Create HelpButton.tsx — fixed-position ❓ in bottom-right
2. Create HelpChat.tsx — slide-out drawer (right side), chat UI with messages, text input, send button
3. Integrate in App.tsx — render HelpButton + HelpChat at root level
4. Chat sends message via `callTool('bmad_help', { message, history })`
5. Responses rendered as markdown, scroll to bottom on new message

### PHASE 4: Model Picker + Review Actions
1. Create ModelPicker.tsx — dropdown with options, localStorage persistence
2. Integrate into StoryDetail (code review), DocsView (doc validation), PhaseView (gate checks)
3. Selected model passed as `preferredModel` in all `bmad_orchestrate` calls from those contexts

### PHASE 5: Dashboard Button Audit
1. Audit every single button/clickable in ALL views
2. Remove any button that doesn't trigger a skill — or add a skill mapping
3. Dashboard.tsx "Next Action" button → determine correct skill from project state
4. PhaseView action buttons → map each to the corresponding skill from the table above
5. FlowDiagram node clicks → trigger skill based on node metadata
6. AgentRoster launch buttons → agent's primary skill
7. SprintBoard actions → /bmad-story, /bmad-dev-story, /bmad-code-review as appropriate

### PHASE 6: Polish
1. All existing views still work — no regressions
2. Dark theme on new components (InitView, HelpChat, ModelPicker)
3. Loading states on help chat responses
4. Empty state for help chat ("Ask me anything about BMad Method...")
5. `pnpm build` succeeds, single HTML output
6. TypeScript strict — zero errors

## Critical Rules

- EVERY button that a user can click MUST result in a BMad skill call (via bmad_orchestrate or bmad_help). No exceptions.
- The app is an orchestration layer — it NEVER implements BMad logic itself
- Help chat is conversational — maintain message history in React state
- Model picker preference is advisory — the host may ignore it
- Init detection is simple: does `_bmad-output/` exist? No → show InitView. Yes → normal dashboard.
- Don't break existing functionality (sprint board, flow diagram, parallel view, etc.)

## Completion Criteria

The app is DONE when:
1. `pnpm build` produces a single HTML bundle — zero TypeScript errors
2. New project (no _bmad-output/) shows InitView with "Initialize" button that calls `/bmad-product-brief`
3. Help chat opens via ❓ button from any view, sends messages via `/bmad-help`, renders markdown responses
4. Model picker appears on review actions, selection persists in localStorage
5. EVERY button in the app triggers a BMad skill — audit confirms zero decorative-only buttons
6. Flow diagram node clicks trigger corresponding skill
7. Agent roster launch buttons trigger primary skill
8. Dashboard "Next Action" triggers correct skill based on project state
9. Dark theme consistent on all new components
10. No regressions on existing views (sprint board, docs, parallel, etc.)

When ALL criteria are met, output: DONE
```
