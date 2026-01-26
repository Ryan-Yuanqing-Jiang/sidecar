# Milestone 1 Implementation Plan - Instant Explainer (Walking Skeleton)

## Context recap
Milestone 1 builds the "walking skeleton" for Knowledge Sidecar: a user selects text in ChatGPT/Gemini, triggers an "Explain" action, and a new KnowledgeNode is created and rendered in the side panel **from IndexedDB only**. The content script injects the structured prompt with a `SIDECAR_JOB_ID`, observes completion, and sends raw output to the background for parsing and persistence. Failures must be explicit (`parse_failed`, `timeout`).

## Current state (as of scaffold)
- MV3 extension scaffold is in place (Vite + CRXJS + React + TS).
- `src/manifest.json` registers background, content scripts, and a side panel.
- `Dexie` DB exists but is **not used** by background or side panel UI.
- Side panel is a static mock; no live DB rendering.
- Content script adapters exist but `observeCompletion` returns empty; no extraction.
- No context menu or selection handling.
- Message flow is stubbed; background does not create or update KnowledgeNodes.
- Types and DB schema do **not** match PRD (missing `jobId`, `processing`, etc.).

## Implementation plan (step-by-step)

### Phase 1 - Data model + DB wiring
1. **Align types with PRD**
   - Update `KnowledgeNode` in `src/types/index.ts` to include:
     - `jobId: string`
     - `status: 'waiting' | 'processing' | 'ok' | 'parse_failed' | 'timeout'`
   - Decide whether `id` and `jobId` are distinct or identical; for M1, use distinct but identical values for simplicity.
2. **Update Dexie schema**
   - Modify `src/db/index.ts` to include `jobId` index and new status values.
   - If schema version changes, add a migration to `src/db/migrations.ts`.
3. **Add live query support**
   - Add dependency `dexie-react-hooks` and use `useLiveQuery` in side panel.

### Phase 2 - Side panel (DB-first UI)
4. **Initialize DB on side panel startup**
   - Import `db` and call `db.open()` or rely on first query.
5. **Render nodes from IndexedDB**
   - Use `useLiveQuery` to fetch nodes sorted by `createdAt` (descending).
   - Render a list of cards: topic, status badge, and content (simple text).
6. **Explicit status states**
   - `waiting` / `processing`: show loading state.
   - `ok`: show `content.simple`.
   - `parse_failed` / `timeout`: show failure text + optional raw snippet.

### Phase 3 - Background job orchestration
7. **Context menu + selection capture**
   - Add `contextMenus` permission to `src/manifest.json`.
   - In `src/background/index.ts`, create a context menu item `Explain with Knowledge-Sidecar` for selection contexts.
   - On click, read `info.selectionText` and active tab URL; ignore if empty.
8. **Job creation + DB insert**
   - Generate `jobId` (`crypto.randomUUID()`) and create `KnowledgeNode` with `status: 'waiting'`.
   - Persist to Dexie immediately to satisfy REQ-1.2 / Story 1.1.
9. **Dispatch to content script**
   - Send `RUN_EXPAND_CONCEPT` to the active tab with payload `{ jobId, concept, promptVersion }`.
   - If send fails, update node to `parse_failed` with an error string in `raw`.
10. **Timeout handling (MV3-safe)**
   - Use `chrome.alarms` to schedule a 30s timeout per jobId.
   - On alarm, if node is still `waiting`/`processing`, update to `timeout`.

### Phase 4 - Content script injection + observation
11. **Adapter selection**
   - Ensure `content/index.ts` selects a single adapter and errors if no match.
12. **Prompt injection**
   - Use `buildPrompt()` to include `SIDECAR_JOB_ID` and JSON schema.
   - Adapter should inject text into the host input and submit.
13. **Observation & extraction**
   - Implement `observeCompletion` in the ChatGPT adapter:
     - Detect a new assistant response node after submission.
     - Wait for completion signal (e.g., stop button disappears) OR mutation quiet window (e.g., 1-2s of no changes).
     - Extract response text; strip any visible `SIDECAR_JOB_ID` if present.
   - Send `{ jobId, raw }` to background with `RAW_RESPONSE`.
14. **Gemini adapter (optional for M1)**
   - If included, implement minimal injection + last-response scrape using a basic selector and a similar quiet-window observer.

### Phase 5 - Background parsing + persistence
15. **Parse raw response**
   - Use existing `parseResponse` (extend to strip code fences).
   - Update node status to `ok` or `parse_failed` accordingly.
   - Store `raw` and `content` on success.
16. **Clear timeout alarms**
   - On successful parse or parse_failed, clear the job alarm to avoid false timeouts.

### Phase 6 - UX polish for M1 acceptance
17. **Side panel content focus**
   - Ensure only `simple` explanation is shown (M1 requirement).
   - Include `topic` and `createdAt` for traceability.
18. **Basic error visibility**
   - Make failures obvious; avoid silent drops.

## TODO list (engineering checklist)
- [x] Update `KnowledgeNode` type to include `jobId` and M1 statuses.
- [x] Update Dexie schema to include `jobId` index and migration version bump.
- [x] Add `dexie-react-hooks` dependency.
- [x] Implement side panel live rendering via `useLiveQuery`.
- [x] Render explicit status states for `waiting`, `processing`, `ok`, `parse_failed`, `timeout`.
- [x] Add `contextMenus` permission in manifest.
- [x] Create context menu item and selection handler in background.
- [x] Generate jobId + insert node in Dexie immediately on user action.
- [x] Dispatch job to content script and handle send errors.
- [x] Schedule 30s timeout via `chrome.alarms` and update DB on timeout.
- [x] Implement ChatGPT adapter `observeCompletion` with completion detection.
- [x] Ensure prompt injection includes `SIDECAR_JOB_ID` and schema.
- [x] Send raw output back to background (`RAW_RESPONSE`).
- [x] Parse raw output in background and update DB status/content.
- [x] Clear timeout alarms on completion.
- [x] Verify side panel renders updated node from DB (no direct message reliance).

## Risks / feasibility notes
- **DOM volatility:** ChatGPT/Gemini selectors may change; observer logic must be defensive. M1 should target a minimal, best-effort extraction.
- **MV3 timeouts:** Service worker may suspend; use `chrome.alarms` instead of `setTimeout` for the 30s timeout guarantee.
- **Completion detection:** No guaranteed signal; recommend mutation quiet-window + stop button detection where possible.

If any of these are not feasible (especially reliable extraction signals), we should discuss fallback UI pathways or a more conservative extraction heuristic.
