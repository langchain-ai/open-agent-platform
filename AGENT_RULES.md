# Agent Rules: Purpose-First Development Workflow

## Non‑negotiable principles
- Treat warnings as signals: Every warning implies incomplete work. Investigate and complete intent.
- No removals without intent: Before deleting anything “unused,” identify why it was added and whether a feature is incomplete.
- Read upstream/downstream: Always trace data and UX flows before edits (backend → types → state → components → UX).
- UX consistency: Follow existing patterns (icons, badges, Sheet/Tabs, MarkdownText). Don’t regress interactions.
- No placeholder fixes: Implement intended behavior; avoid suppressions and temporary hacks.

## Pre‑change reasoning checklist (before every edit)
1) Purpose: What UX outcome or behavior are we enabling?
2) Data: Where does it come from (API endpoint, MCP message, file)?
3) Types: Are TypeScript interfaces aligned across boundaries?
4) State: How is it stored/hydrated/cleaned up?
5) Consumers: Which components read it? How should they render it?
6) UX: Which iconography/badges/surfaces are appropriate?
7) Errors: What’s the user-friendly, actionable error?
8) Token/size: Do we need size estimation and warnings?
9) Impacts: Who else depends on this (props/providers/routes)?
10) Verification: How will we test (manual + scripts)?

## Unused symbol triage
- If “unused,” assume intent was planned. Inspect sibling components/patterns.
- If relevant to current scope, implement the missing piece.
- Only remove after confirming it’s out-of-scope or redundant.

## Warning/error triage
- TypeScript: Fix the boundary first (API → types → hooks → components). Avoid `any`.
- ESLint: For unused items, validate intent; implement or remove accordingly. For hooks deps, add deps or memoize callbacks/values.
- UI/UX: Markdown → pass strings to MarkdownText; style via its `className`. Use Sheet + Tabs for long views.
- Build/runtime: Use npm per AGENT_WORKFLOW.md. Never rely on suppressions.

## Upstream/downstream reading protocol
- Backend: libs/server/… (protocol, routers, managers)
- Types: apps/web/src/types/…
- API client: apps/web/src/lib/…
- State: apps/web/src/hooks/…
- UI: apps/web/src/features/… components

## UX expectations
- Agent Modes indicators: consistent iconography and badges.
- Full views: Sheet + Tabs + MarkdownText.
- Token warnings: tiered Alerts by size.
- Progressive disclosure when lists are long.

## Iterative workflow (use npm scripts)
1) Implement one focused change
2) npm run check (fix everything)
3) npm run fix (autofix) → re-check
4) npm run build:internal → if anything signals incomplete work, go back to 1

## Do / Don’t
- Do: Preserve patterns, complete missing pieces, improve error messaging, keep strict types.
- Don’t: Suppress warnings, remove code blindly, add placeholders.

## Definition of Done
- Feature renders correctly across all relevant surfaces
- No TypeScript/ESLint errors
- Warnings addressed where they indicate incomplete scope
- Visuals consistent; state persists and hydrates correctly
- Final build passes



