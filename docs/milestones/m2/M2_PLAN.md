# Milestone 2 Implementation Plan - Deep Diver (Recursive MVP)

## Context recap
M2 adds recursive learning and session isolation. Users can trigger follow-up explanations from within the side panel, creating a persistent stack of nodes (A → B → C). The UI becomes a threaded list, ordered by creation time, and scoped per session. Parsing must be more robust (strip conversational filler), and error states must include a “Show Raw” affordance.

## Current state (post-M1)
- KnowledgeNode now has `jobId` and expanded statuses, but **no `parentId` or `sessionId`**.
- Side panel renders a live list from Dexie; currently sorted newest-first, shows `simple` content only.
- Background job creation is via context menu; jobs are not session-scoped.
- Prompt template still requests `simple` + `technical` fields.
- Parser strips code fences, but does not repair or extract JSON from text with leading/trailing filler.
- No side panel input, no chaining, no auto-scroll, no raw debug display.

## Implementation plan (step-by-step)

### Phase 1 - Data model + migration
1. **Extend `KnowledgeNode` for recursion + sessions**
   - Add `parentId: string | null` and `sessionId: string` to type.
   - Decide whether sessionId is based on tabId or URL hash (PRD suggests either).
2. **Update Dexie schema**
   - Add `parentId` and `sessionId` indexes.
   - Bump DB version and add migration strategy (if needed) to avoid breaking existing M1 data.

### Phase 2 - Session management
3. **Session ID generation**
   - In background, generate `sessionId` using tabId or URL (e.g., `${tabId}:${origin}` or hash of URL).
   - Persist in each node created for that tab.
4. **Side panel session detection**
   - Use `chrome.tabs.query({ active: true, currentWindow: true })` to determine active tab.
   - Derive same `sessionId` in the side panel, and pass into `useLiveQuery`.
   - Ensure side panel updates when active tab changes (listen to `chrome.tabs.onActivated` and `chrome.tabs.onUpdated`).

### Phase 3 - Recursive input + job chaining
5. **Add side panel “Ask about…” input**
   - Add a sticky input section at bottom of the side panel.
   - Allow enter key + button click to submit.
6. **Track current node for chaining**
   - Define “current node” as the last (newest) node in the stack for the session.
   - When user submits, create a new job with `parentId` set to the current node id (if any).
7. **Dispatch job from side panel to background**
   - Add a `START_JOB_FROM_PANEL` message type with concept + parentId + sessionId.
   - Background reuses job creation pipeline: insert node → schedule timeout → send to content script.

### Phase 4 - Threaded stack UI behavior
8. **Thread view ordering**
   - Update side panel query: sort by `createdAt` ascending (oldest first).
9. **Auto-scroll to bottom**
   - Use `useEffect` + `ref` to scroll the list container when nodes change.
10. **Render Markdown content**
   - Replace simple text rendering with a single Markdown block (e.g., `marked` or `react-markdown`).
   - Ensure no Simple/Technical toggle.

### Phase 5 - Prompt update + parser hardening
11. **Prompt template update**
   - Change prompt to request `{ "content": "..." }` only.
   - Adjust parser to read `content` key instead of `simple`/`technical`.
12. **Robust JSON extraction**
   - Implement repair/extraction: find first `{` and last `}` OR use `json-repair` to fix minor errors.
   - Strip conversational preamble and trailing text.
   - Preserve raw text in DB regardless of success.

### Phase 6 - Error UI with “Show Raw”
13. **Error state UI**
   - For `parse_failed`, show “Parse Error” with a “Show Raw” button.
   - Expand/collapse raw content in-place.

## TODO list (engineering checklist)
- [ ] Add `parentId` and `sessionId` to `KnowledgeNode` type.
- [ ] Update Dexie schema for new fields and bump DB version.
- [ ] Implement sessionId generation in background.
- [ ] Implement sessionId derivation in side panel; requery on tab changes.
- [ ] Add side panel input (“Ask about…”) with submit handler.
- [ ] Determine current node and pass `parentId` when chaining.
- [ ] Add `START_JOB_FROM_PANEL` background message and handler.
- [ ] Update side panel query to sort oldest → newest.
- [ ] Add auto-scroll to bottom on new node.
- [ ] Render node content as Markdown.
- [ ] Update prompt template to single `content` key.
- [ ] Update parser to handle `content` and repair/extract JSON from noisy output.
- [ ] Add parse error UI with “Show Raw” toggle.

## Risks / feasibility notes
- **Session ID consistency:** side panel and background must compute identical session IDs; use a shared utility to avoid drift.
- **Active tab in side panel:** tab queries require permissions and may race on activation; must handle null tab gracefully.
- **Parsing robustness:** json-repair adds dependency; if avoided, regex extraction must be conservative to prevent false positives.

If any of these risks are unacceptable or if session ID strategy is unclear, confirm before implementation.
