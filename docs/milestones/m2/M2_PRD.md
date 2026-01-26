# PRD: Milestone 2 - The "Deep Diver" (Recursive MVP)

**Version:** 2.1
**Status:** Ready for Execution
**Goal:** Enable recursive learning. Users can generate follow-up explanations from within the Side Panel, creating a persistent "Stack" of knowledge (A  B  C) that survives page reloads.

---

## 1. Problem Scope

**The Friction:**
A single definition often reveals *more* jargon (e.g., "Transformer"  "Self-Attention").

* **Current State (M1):** The user gets one definition. If they want to understand the *parts* of that definition, they are stuck or have to start over.
* **The M2 Solution:** A "Drill-Down" mechanism. The user can traverse A  B  C without leaving the Side Panel. The UI transforms from a single ephemeral card into a **Threaded Stack** that preserves the history of the investigation.

---

## 2. Functional Requirements & User Stories

### 2.1. The "Recursive" Trigger (The Interaction)

**Objective:** Initiate a new `Job` from within the Side Panel context.

* **REQ-1.1 (Manual Entry):** Add a simple input field ("Ask about...") at the bottom of the Side Panel to manually query a sub-concept.
* **REQ-1.2 (Job Chaining):** When a new query is triggered while viewing Node A, the new Node B must record `parentId = NodeA.id`.

> **Story 1.1 (The Drill Down):**
> * **GIVEN** I am reading an explanation of "Transformers" in the Side Panel
> * **WHEN** I type "Self-Attention" into the Side Panel input
> * **THEN** a new loading card should appear *below* the "Transformers" card, and the extension should automatically inject a new prompt into the host chat.
> 
> 

### 2.2. The Stack UI (The View)

**Objective:** Visualize the depth of the learning session.

* **REQ-2.1 (Thread View):** Render `KnowledgeNode` items as a vertical list, sorted by `createdAt` (oldest top, newest bottom).
* **REQ-2.2 (Auto-Scroll):** When a new node is added, automatically scroll the Side Panel to the bottom.
* **REQ-2.3 (Single Mode Content):** Render the node content as a single Markdown block (no Simple/Technical tabs).

> **Story 2.1 (The Thread):**
> * **GIVEN** I have asked about "Transformers", then "Self-Attention", then "Dot Product"
> * **WHEN** I look at the Side Panel
> * **THEN** I should see three distinct cards in a vertical column, representing my journey A  B  C.
> 
> 

### 2.3. Session Isolation (The Context)

**Objective:** Ensure data doesn't bleed between different tabs or topics.

* **REQ-3.1 (Session ID):** The Background Worker must generate a `sessionId` based on the Tab ID or URL Hash.
* **REQ-3.2 (Scoped Query):** The Side Panel `useLiveQuery` must filter nodes: `.where('sessionId').equals(currentSessionId)`.

> **Story 3.1 (Context Safety):**
> * **GIVEN** I have a learning session on Tab A (React Docs) and another on Tab B (Wikipedia)
> * **WHEN** I switch from Tab A to Tab B
> * **THEN** the Side Panel should clear the "React" stack and load the "Wikipedia" stack from Dexie.
> 
> 

### 2.4. Robust Parsing (The Guardrails)

**Objective:** Handle LLM unpredictability.

* **REQ-4.1 (JSON Repair):** Implement a utility (e.g., `json-repair` or regex extraction) to find the valid JSON object if the LLM adds conversational filler before/after the JSON block.
* **REQ-4.2 (Error State UI):** If parsing fails completely, the Node Card in the UI must show a "Parse Error" state with a **"Show Raw"** button to let the user debug/read the unformatted text.

> **Story 4.1 (Graceful Failure):**
> * **GIVEN** the LLM replies "Sure! Here is the JSON: { ... }" instead of just JSON
> * **WHEN** the Background Worker receives the text
> * **THEN** it should correctly strip the "Sure!..." prefix and parse the JSON, resulting in a successful card.
> 
> 

---

## 3. Technical Constraints (Arch v2.0)

* **Dexie Schema:** Ensure `KnowledgeNode` includes `parentId` and `sessionId`.
* **Platform Adapter:** The `injectPrompt` method must handle subsequent messages in a long chat history.
* *Challenge:* In ChatGPT, the DOM selector for the *active* input box might change or be obscured.
* *Mitigation:* The adapter must dynamically find the *current* valid input box before every injection.


* **Prompt Template Update:** Remove the "Simple/Technical" keys from the JSON request. Use a single `content` key.

---

## 4. Acceptance Criteria (Definition of Done)

**The AI Agent can validate M2 when:**

1. **Recursive Flow Test:**
* [ ] User triggers "Explain A".
* [ ] Result A appears.
* [ ] User triggers "Explain B" (via Side Panel input).
* [ ] Result B appears *below* Result A.
* [ ] **DB Check:** Node B has `parentId` == Node A's ID.


2. **Persistence Test:**
* [ ] User refreshes the page.
* [ ] Side Panel reloads.
* [ ] The Stack (A & B) reappears automatically from Dexie.


3. **Session Test:**
* [ ] Open a new Tab.
* [ ] Side Panel is empty (or shows that tab's specific history).



---

## 5. Out of Scope (For M2)

* **Visual Graph:** We are using a simple List/Stack view for now. No nodes-and-edges visualization yet.
* **Content Toggle:** No Simple/Technical switch. Just one clear explanation.
* **Tree Navigation:** We are only supporting "Drill Down" (A  B  C). We are not optimizing for jumping back up yet.
* **Account Sync:** Local storage only.
