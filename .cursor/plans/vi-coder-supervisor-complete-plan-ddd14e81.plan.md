<!-- ddd14e81-8006-4b72-a1bc-c92876e0c3c8 0d3c05f7-8f1d-40f2-bbe3-2222de307a31 -->
# Vi Coder – Comments, Config URL Sync, and Error UX Plan

## Clarifications Needed

1. Comment storage preference?

- a) Thread state only
- b) Thread state + GitHub issue mirror - this option, where it's easiest to do
- c) GitHub issue only

2. URL config sync scope?

- a) Mode/guidance toggles only 
- b) All non-sensitive run toggles (recommended) -- ok this
- c) Include component-level view options

---

## What to Read First (Patterns)

- Comments/state patterns:
- `apps/open-swe/src/tools/communication/request-supervisor-guidance.ts`
- `apps/open-swe/src/graphs/manager/nodes/supervisor/index.ts`
- `apps/open-swe/src/graphs/planner` and `programmer` nodes (Command/update usage)
- `packages/shared/src/open-swe/types.ts` (graph state schemas)
- UI composition:
- `apps/web/src/components/v2/actions-renderer.tsx`
- `apps/web/src/components/gen-ui/action-step.tsx`
- `apps/web/src/components/v2/thread-view.tsx`
- `apps/web/src/components/thread/messages/*`
- Streaming/state wiring:
- `apps/web/src/providers/Thread.tsx`, `useStream`
- Config and top-bar controls:
- `apps/web/src/components/v2/default-view.tsx`
- `apps/web/src/components/v2/terminal-input.tsx`
- `apps/web/src/components/configuration/config-field.tsx`

---

## Design Summary

- **Comment model**: `Comment` with fields `{ id, target: { type: 'tool_call'|'message'|'thread', id }, authorRole: 'human'|'supervisor'|'planner'|'programmer', content, createdAt }`.
- **Storage**: Append-only arrays per thread in state: `comments: Comment[]`; plus `commentsIndex: Record<string /*targetId*/, string[] /*commentIds*/>` for O(1) lookups.
- **APIs/tools**: New tools `add_comment` and `edit_comment` available to supervisor/planner/programmer; UI posts/edits via SDK `client.threads.updateState` for human. Both support `parent_id` for replies and include `authorName`. Roles: 'human'|'supervisor'|'planner'|'programmer'.
- **Rendering**: Under each Action/ToolCall, render a collapsible “Comments” pane with author badges and timestamps; global thread-level board in right column. - yes, as welkl as the tabs that the planner and programmer render and other tabs that might go there
- **Integration**: Optional mirroring to GitHub issue comments when issue exists (toggle `mirrorCommentsToGitHub`). -- yes, I like it as a configurable option, only if it's not too complicated
- **URL config sync**: Serialize non-sensitive toggles (`supervisorMode`, `workerGuidanceStrategy`, `shouldCreateIssue`, `autoAcceptPlan`, `mirrorCommentsToGitHub`) via `nuqs` as `config_<key>=<value>`; hydrate on mount. -only if very easy, doesn't provide immediate value to me right now
- **Error UX**: Central `reportError()` for UI toasts; server logs include file/function context. Do not expose secrets. --yes, wherever easy and however re-usable you can make it.

---

## Implementation Steps

### A) Types and State (Shared)

- Add `Comment` and `CommentsState` types to `packages/shared/src/open-swe/types.ts`.
- Extend manager/planner/programmer state annotations with optional `comments` and `commentsIndex` reducers (append-only).

### B) Backend Tools & Nodes

- Create `apps/open-swe/src/tools/collab/add-comment.ts` tool:
- Zod schema: `{ target_type, target_id, content }` + optional `mirror: boolean`.
- Returns `Command({ update: { comments: [...], commentsIndex: {...} }, messages: [ToolMessage with tool_call_id] })`.
- Register tool in supervisor/planner/programmer toolsets (respect mode filters).
- (Optional) In `request-supervisor-guidance`, when human responds, also write a `Comment` (authorRole 'human'). --yes, this kind of logical deduction is good
- If mirroring enabled and GitHub issue present, post as issue comment with author tag.

### C) UI – Action/Thread Comments

- In `actions-renderer.tsx` and `gen-ui/action-step.tsx`:
- Add comment toggle (MessageSquare) on each action.
- Render comments for target `tool_call_id` via `commentsIndex` and `comments`.
- Provide textarea + “Post” for humans; persist via `client.threads.updateState` (creates `Comment` with authorRole 'human').
- In `thread-view.tsx`:
- Add a thread-level “Discussion” tab/panel showing all comments grouped by target.
- Ensure `useStream` picks `comments` from state updates.
- Author badges/colors for roles; show timestamps.

### D) URL Config Sync

- In `configuration/config-field.tsx`:
- Use `useQueryState` to sync fields: id whitelist: `supervisorMode`, `workerGuidanceStrategy`, `shouldCreateIssue`, `autoAcceptPlan`, `mirrorCommentsToGitHub`.
- Parse/serialize per type, hydrate on mount, prefer external state if provided.
- In `default-view.tsx`:
- On mount, hydrate top-bar toggles from URL first, then from `defaultConfig`.

### E) Error UX and Logging

- Add `apps/web/src/lib/error-reporting.ts`: `reportError(source: string, err: unknown, extras?: Record<string,unknown>)` → `toast.error` + `console.warn` in dev.
- Replace local toasts with `reportError` in `useGitHubToken`, `thread-card`, `terminal-input` send path, and others marked in warnings.
- On server (e.g., `api/restart-run/route.ts`), standardize `console.error` messages to include file and function; include `threadId`/`runId` when available.

### F) Task Status Indicator (Light Touch)

- Re-enable `isLatestTask` and show a subtle “Historical View” badge when user navigates away from active task.
- Keep programmer’s existing active styling as primary indicator.

### G) Install Selector Icons (Deferred but Ready)

- Call `getAccountIcon()` in installation select trigger/options; keep behind a small feature flag if needed.

### H) React Hook Hygiene

- Where lint rules were disabled intentionally, add clear inline comments; otherwise, include missing deps or memoize upstream callbacks.

---

## Validation

- Manual flows:
- Post comment as human on an action; see it appear in panel; refresh persists. -- yes, same for agents - streaming
- Planner/programmer add comment via tool; visible in UI; optionally mirrored to GitHub. -- supervisor too, as well as all needing the tools to read/see the comments/discussions
- Share a URL with config params; opening hydrates toggles and affects new run config.
- Error surfaces via toast with context and logs include file/function.
- Build: `yarn build` succeeds; no new TS errors.
- Lint: no new errors; hook warnings either resolved or commented with rationale.

---

## Notes

- Never sync secrets/tokens in URL.
- Comments stored in thread state are authoritative; GitHub mirroring is best-effort, non-blocking.
- Keep multi-mode intact; tools visible per mode per existing filter patterns.

### To-dos

- [ ] Fix page.tsx type error by adding <ManagerGraphState> generic to useThreadsSWR call
- [ ] Add error message displays to all catch blocks using toast notifications
- [ ] Implement getAccountIcon usage in installation-selector.tsx
- [ ] Add visual indicator for isLatestTask in tasks/index.tsx
- [ ] Replace Check icon with CheckCircle in request-human-help.tsx
- [ ] Investigate and implement or suppress useQueryState in config-field.tsx
- [ ] Investigate MessageSquare usage for action-step.tsx comment feature
- [ ] Remove unused eslint-disable directive from restart-run/route.ts
- [ ] Run full build and verify all TypeScript errors resolved