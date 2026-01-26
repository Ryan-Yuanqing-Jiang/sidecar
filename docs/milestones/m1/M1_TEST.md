# Milestone 1 Testing Plan

## Automated tests

### Scope and goals
Automated tests should validate the milestone requirements and acceptance criteria with deterministic unit tests (CI-friendly). Focus on background parsing, prompt generation, adapter selection logic, and DB updates. UI rendering and DOM scraping are primarily manual for M1 but can be minimally validated with pure unit tests where possible.

### Test tooling plan
- Use `vitest` for unit tests.
- Use `fake-indexeddb` to test Dexie logic without a browser.
- Use `@types/chrome` mocks for background message handling tests.

### Testable modules (target list)
1. **Prompt builder** (`src/content/injector.ts`)
2. **Parser** (`src/background/parser.ts`)
3. **Job orchestration** (`src/background/jobs.ts` and new job lifecycle utilities)
4. **DB operations** (`src/db/index.ts`)
5. **Timeout flow** (alarm handler in background)

### Automated test TODO list
- [ ] Add dev dependencies: `vitest`, `fake-indexeddb`, `@vitest/coverage-v8`.
- [ ] Create `vitest.config.ts` with `environment: 'node'` and setup file to install `fake-indexeddb/auto`.
- [ ] Add test script to `package.json` (e.g., `test` and `test:ci`).
- [ ] Add a `tests/` folder with unit tests per module.
- [ ] Implement a small `chrome` API mock for `runtime.onMessage`, `tabs.sendMessage`, and `alarms`.

### Automated test cases (unit-level)
1. **Prompt template**
   - GIVEN a concept and jobId WHEN `buildPrompt` is called THEN the result includes `SIDECAR_JOB_ID=...` and required JSON schema keys.
   - GIVEN prompt version WHEN building the prompt THEN it includes `PROMPT_VERSION=...`.

2. **Parser behavior**
   - Valid JSON parses to `status: ok` with `simple` + `technical` content.
   - JSON wrapped in code fences is parsed successfully after stripping.
   - Invalid JSON returns `status: parse_failed` and preserves raw.
   - Missing fields returns `status: partial`.

3. **DB insert/update flow**
   - Create node with `waiting` persists in Dexie and is queryable by jobId.
   - Update node with parsed content changes status to `ok`.
   - Update node on parse failure sets `parse_failed` and stores raw.
   - Timeout update sets `status: timeout` for nodes still `waiting`/`processing`.

4. **Job dispatch orchestration**
   - GIVEN a selection string WHEN job is created THEN the jobId is generated and `KnowledgeNode` is inserted before dispatch.
   - WHEN `tabs.sendMessage` fails THEN node is updated to `parse_failed` with error in `raw`.

5. **Timeout scheduling**
   - WHEN job is started THEN an alarm is scheduled with name including jobId.
   - WHEN completion happens THEN the alarm is cleared and node is not overwritten to timeout.

## Manual test cases

1. **Context menu availability**
   - Go to `https://chatgpt.com`.
   - Ask about `Tell me how Transformer framework works`
   - Select any pre-requisite concepts listed in the page that a user may need to understand `Transformer` (i.e. `token`).
   - Right click and verify the item `Explain with Knowledge-Sidecar` appears.

2. **Immediate DB-driven UI update**
   - Open the extension side panel.
   - Select text and click `Explain with Knowledge-Sidecar`.
   - Confirm a new card appears immediately with `waiting` or loading state.

3. **Prompt injection**
   - After triggering Explain, observe the ChatGPT input.
   - Confirm it is filled with the structured prompt including `SIDECAR_JOB_ID` and JSON schema.

4. **Response extraction success**
   - Let ChatGPT respond fully.
   - Confirm side panel updates to `ok` and displays the `simple` explanation.

5. **Parse failure handling**
   - Manually edit the response to break JSON (e.g., remove a quote) before completion.
   - Confirm side panel updates to `parse_failed` with an error indicator.

6. **Timeout handling**
   - Trigger Explain, then interrupt generation or block the content script.
   - Wait 30 seconds.
   - Confirm node updates to `timeout` state.

7. **Persistence check**
   - Reload the side panel or browser tab.
   - Confirm previous nodes still render from IndexedDB.
