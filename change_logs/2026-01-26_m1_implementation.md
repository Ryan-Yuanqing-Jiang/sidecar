# Milestone 1 implementation (2026-01-26)

## What changed
- Reworked `KnowledgeNode` to match M1 PRD (added `jobId`, expanded status enum) and updated Dexie schema/versioning.
- Wired the side panel to render live data from IndexedDB via `dexie-react-hooks` and added explicit status UI states.
- Implemented background job orchestration with context menu trigger, job creation, DB persistence, and timeout handling via `chrome.alarms`.
- Added robust prompt parsing (including code fence stripping) and persisted raw output + parsed content to IndexedDB.
- Implemented content-script observation to detect assistant responses and return raw output to the background.
- Updated M1 plan TODOs to reflect completed tasks.

## Fixes (Post-Code Review)
- **Race Condition Fix:** Moved status update to `processing` *before* awaiting the long-running content script operation to prevent overwriting the final `ok` status.
- **Error Handling:** Added checks for explicit error responses from the content script injection call to ensure failures are caught and logged to the DB.

## Testing (Automated)
- Added `vitest` and `fake-indexeddb` for unit testing.
- Implemented comprehensive unit tests for:
  - **Prompt Builder:** Verifies injection of `SIDECAR_JOB_ID` and schema.
  - **Parser:** Validates JSON parsing, markdown stripping, and error handling.
  - **Database:** Checks CRUD operations with `fake-indexeddb`.
  - **Background Logic:** Tests job orchestration, context menu handling, and timeouts using a Chrome API mock.

## Why
- Deliver the M1 "Instant Explainer" walking skeleton per PRD: local-first storage, job-based flow, prompt injection, extraction, parsing, and side panel rendering with explicit failure states.
