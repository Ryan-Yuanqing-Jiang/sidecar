Here is the updated **PRD for Milestone 1**, rewritten to strictly adhere to the **Architecture Specification v2.0.0**.

**Major Shift:** Unlike the previous draft, this version **requires** the implementation of the Database (`Dexie`) and the Job Orchestration system immediately. We are no longer building a "throwaway" message-passing extension; we are building the **"Walking Skeleton"** of the final architecture.

---

# PRD: Milestone 1 - The "Instant Explainer" (Architecture Pathfinder)

**Version:** 2.0
**Status:** Ready for Execution
**Goal:** Deploy the "Walking Skeleton" of the Local-First Architecture. The user can highlight text, trigger an explanation, and see the result in the Side Panel, rendered purely from the local Database via the Platform Adapter system.

---

## 1. Problem Scope

**The Friction:**
Users reading technical content in ChatGPT/Gemini lose context when they have to ask clarifying questions about sub-concepts.

**The Solution:**
A "Knowledge-Sidecar" utility that injects a structured prompt into the host chat, extracts the response using a specific `Job ID`, and persists it to a local database for display in a side panel.

---

## 2. Architectural Constraints (Strict)

* **Local-First:** The Side Panel **must not** rely on ephemeral messages from the Content Script for display. It must listen to `Dexie` (IndexedDB) changes.
* **Platform Adapters:** DOM manipulation logic must be encapsulated in a `PlatformAdapter` interface, not scattered in scripts.
* **Job-Based Flow:** Every user action initiates a `Job` with a UUID. The response extraction is correlated via `SIDECAR_JOB_ID` embedded in the prompt.
* **Explicit Failure:** If the extraction fails, the UI must show a "Failed" status, not hang indefinitely.

---

## 3. Functional Requirements & User Stories

### 3.1. The Side Panel (The View)

**Objective:** Render the state of the `KnowledgeNode` table from IndexedDB.

* **REQ-1.1:** Initialize `Dexie` database on startup.
* **REQ-1.2:** Use `useLiveQuery` to render the list of explanations.
* **REQ-1.3:** Display explicit states based on Node Status (`waiting`, `ok`, `error`).

> **Story 1.1 (Reactive UI):**
> * **GIVEN** I have triggered an explanation
> * **WHEN** the Background Worker saves the new node to the Database with status 'waiting'
> * **THEN** the Side Panel should *immediately* show a loading card, purely by reacting to the Database change.
> 
> 

### 3.2. The Trigger & Job Dispatch (The Controller)

**Objective:** Initiate the `Job` lifecycle.

* **REQ-2.1:** Detect text selection on Host.
* **REQ-2.2:** Context Menu item: "Explain with Knowledge-Sidecar".
* **REQ-2.3:** On click, send a message to **Background Worker** to create a new `Job` (UUID).

> **Story 2.1 (Job Creation):**
> * **GIVEN** I select "Vector DB" and click "Explain"
> * **WHEN** the action triggers
> * **THEN** a new row should appear in my Side Panel with a "Waiting..." status, and a `Job ID` should be generated internally.
> 
> 

### 3.3. The Platform Adapter (The Injector)

**Objective:** Abstract the Host DOM interactions.

* **REQ-3.1:** Implement a basic `ChatgptAdapter` (and/or `GeminiAdapter`).
* **REQ-3.2:** **Prompt Injection:** Inject the **Arch v2.0 Template** including the `SIDECAR_JOB_ID`.
* **REQ-3.3:** **Submission:** Programmatically submit the prompt.

> **Story 3.1 (Structured Injection):**
> * **GIVEN** the Background Worker has authorized the job
> * **WHEN** the Adapter injects the prompt
> * **THEN** the text input should be hidden or quickly filled with the system prompt containing `SIDECAR_JOB_ID=...` and the JSON schema request.
> 
> 

### 3.4. The Observer & Extractor (The Scraper)

**Objective:** robustly capture the specific response for the Job.

* **REQ-4.1:** Watch for the completion signal (e.g., "Stop Generating" disappears).
* **REQ-4.2:** Scan the latest response for the specific `SIDECAR_JOB_ID` (if visible) or simply grab the last message if strictly sequential.
* **REQ-4.3:** Send raw text to Background for processing.

> **Story 4.1 (Extraction):**
> * **GIVEN** ChatGPT has finished generating the JSON response
> * **WHEN** the observer detects the idle state
> * **THEN** the raw JSON text should be extracted and sent to the Background Worker to close the Job.
> 
> 

### 3.5. Background Processing (The Brain)

**Objective:** Parse and Persist.

* **REQ-5.1:** Receive raw text.
* **REQ-5.2:** Attempt `JSON.parse` (strip code fences if needed).
* **REQ-5.3:** Update the `KnowledgeNode` in Dexie with content and set status to `ok` (or `parse_failed`).

> **Story 5.1 (Completion):**
> * **GIVEN** valid JSON is returned
> * **WHEN** the Background Worker updates the DB
> * **THEN** the Side Panel loading card should flip to show the "Simple" explanation text.
> 
> 

---

## 4. Non-Functional Requirements

* **NFR-1 (Resilience):** If the scraper times out (30s), the Background Worker must explicitly update the DB node status to `timeout`. The UI must reflect this.
* **NFR-2 (Isolation):** Styles must use Tailwind and be scoped to the Side Panel/Shadow DOM to avoid breaking ChatGPT.
* **NFR-3 (Manifest V3):** The Background Worker must not rely on global variables for state; it must read/write to DB.

---

## 5. Data Modeling

**KnowledgeNode (IndexedDB):**

```typescript
interface KnowledgeNode {
  id: string;             // UUID
  jobId: string;          // The correlation ID
  topic: string;          // "Vector DB"
  status: 'waiting' | 'processing' | 'ok' | 'parse_failed' | 'timeout';
  content?: {
    simple: string;
    technical: string;
  };
  raw?: string;           // Fallback for debugging/failed parse
  createdAt: number;
}

```

**Prompt Example:**

```text
You are a learning engine.
SIDECAR_JOB_ID={JOB_ID}
Return ONLY valid JSON:
{
  "simple": "Analogy for {TOPIC}",
  "technical": "Technical definition of {TOPIC}"
}

```

---

## 6. Acceptance Criteria (Definition of Done)

**The AI Agent can validate M1 when:**

1. **Architecture Check:**
* [ ] `Dexie` is initialized and `KnowledgeNode` table exists.
* [ ] `PlatformAdapter` interface is defined and implemented for at least one host.


2. **Functional Flow:**
* [ ] User triggers "Explain".
* [ ] **DB Check:** A node with status `waiting` immediately appears in Dexie.
* [ ] **Host Check:** ChatGPT input is filled with the JSON prompt + Job ID.
* [ ] **Completion Check:** Upon answer generation, the DB node updates to `ok`.
* [ ] **UI Check:** Side Panel displays the parsed text (Simple mode).


3. **Failure Test:**
* [ ] If the script is manually blocked, the UI eventually shows "Timeout" (not infinite loading).