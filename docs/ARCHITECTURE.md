Awesome spec to start from — this rewrite keeps the **spirit and constraints** of your architect’s design, but hardens it for **real-world DOM churn, MV3 lifecycle weirdness, and LLM unpredictability**.

Below is a **full replacement Architecture Design Doc (v2.0.0)** you could hand to an implementation agent without caveats.

---

# Architecture Specification: Knowledge-Sidecar

**Subtitle:** Local-First Recursive Learning for LLM Interfaces

**Version:** 2.0.0
**Type:** Chrome Extension (Manifest V3)
**Targets:** ChatGPT (`chatgpt.com`), Gemini (`gemini.google.com`)
**Philosophy:** Local-First · No Mandatory Backend · Resilience over Elegance · Explicit Failure States

---

## 1. High-Level Overview

**Knowledge-Sidecar** is a Chrome Extension that augments linear LLM chat interfaces with a **persistent, spatial learning layer**. It enables users to explore prerequisite concepts recursively—without losing the context of their original question.

The extension operates as a **passive co-pilot**:

* It never replaces the host UI
* It never hijacks conversation flow
* It keeps learning state adjacent, inspectable, and recoverable

All user data lives locally. No server is required for core functionality.

---

## 2. Core Design Principles

1. **Local-First, Offline-Resilient**
   All learning state is stored in IndexedDB. The Side Panel must render from local data alone.

2. **Host Volatility Is the Default**
   DOM structure, selectors, and behaviors are assumed to change without notice.

3. **Automation Is Best-Effort, Not Magical**
   Every automated action must have a detectable success/failure state and a manual fallback.

4. **LLM Output Is Unreliable**
   Structured output is *requested*, not *assumed*. Parsing is defensive and status-aware.

5. **MV3 Reality**
   Background service workers are ephemeral. No critical state may live exclusively in memory.

---

## 3. Tech Stack (Strict)

* **Runtime:** Chrome Extension Manifest V3
* **Build Tool:** Vite + CRXJS
* **Framework:** React 18 + TypeScript
* **State & Persistence:** Dexie.js (IndexedDB)
* **Styling:** TailwindCSS (Side Panel isolation only)
* **Visualization:** React Flow (knowledge graph)
* **Icons:** Lucide React

---

## 4. System Architecture

### 4.1 Core Components

#### 1. Side Panel (`/src/sidepanel`)

Primary user interface.

Responsibilities:

* Render Knowledge Graph and Learning Path
* Display Node content (Simple / Technical)
* Initiate “Expand Concept” actions
* Surface system states (waiting, failed, retryable)

Must be able to:

* Render entirely from IndexedDB
* Function even if background worker is sleeping

---

#### 2. Content Script (`/src/content`)

The automation and observation layer.

Responsibilities:

* Detect host platform and load platform adapter
* Inject prompts safely into host UI
* Observe message lifecycle
* Extract assistant responses associated with Knowledge-Sidecar jobs

Constraints:

* Stateless between page reloads
* No long-lived memory assumptions
* Must tolerate partial failures

---

#### 3. Background Service Worker (`/src/background`)

The coordination and validation layer.

Responsibilities:

* Job orchestration
* Message routing
* Parsing, validation, and persistence
* Selector config lifecycle management

---

#### 4. Storage Layer (`/src/db`)

Local persistence via Dexie.

Responsibilities:

* Durable storage of sessions, nodes, and raw outputs
* Indexed queries for graph reconstruction
* Versioned migrations

---

## 5. Platform Abstraction

### 5.1 Platform Adapter Model

Each supported platform implements a **Platform Adapter**:

```ts
interface PlatformAdapter {
  detect(): boolean;
  injectPrompt(prompt: string, jobId: string): Promise<void>;
  submit(): Promise<void>;
  observeCompletion(jobId: string): Promise<RawResponse>;
}
```

Adapters handle:

* textarea vs contenteditable
* React-controlled inputs
* submit mechanics (enter vs click)
* completion detection signals

---

### 5.2 Selector Configuration (Safe + Signed)

Selectors are **data-only**, versioned, and optionally updated remotely.

Safeguards:

* Hard allowlist of domains
* Public-key signature verification
* Cached last-known-good fallback
* Automatic rollback on validation failure

```ts
interface SelectorConfig {
  version: string;
  platforms: Record<'chatgpt' | 'gemini', PlatformConfig>;
}
```

---

## 6. Data Flow (Hardened)

### 6.1 Expand Concept Workflow

1. **User Action**

   * User clicks “Expand Concept” in Side Panel.

2. **Job Creation**

   * Side Panel generates a `jobId` (UUID).
   * Creates a pending KnowledgeNode with status `waiting`.

3. **Dispatch**

   * Side Panel → Background → Content Script
   * Payload includes `jobId`, `concept`, `promptVersion`.

4. **Injection**

   * Content Script injects structured prompt including embedded `SIDECAR_JOB_ID`.

5. **Execution**

   * Content Script submits message using adapter-specific method.

6. **Observation**

   * Content Script runs a **completion state machine**:

     * streaming signals
     * mutation quiescence
     * UI affordance appearance
     * timeout / stop detection

7. **Extraction**

   * Assistant response correlated via embedded `jobId`
   * Raw text sent to Background

8. **Parsing & Validation**

   * Background runs defensive parsing pipeline
   * Validates schema
   * Assigns node status (`ok | partial | parse_failed | timeout`)

9. **Persistence**

   * Node + raw output persisted to Dexie

10. **UI Update**

    * Side Panel reacts to DB change and re-renders graph

---

## 7. Prompt Strategy (Defensive)

### 7.1 Prompt Template (Versioned)

```text
You are generating structured output for a learning tool.

SIDECAR_JOB_ID={JOB_ID}
PROMPT_VERSION=1

Return ONLY valid JSON matching this schema:
{
  "v": 1,
  "concept": "{CONCEPT}",
  "simple": "High-level explanation using analogy",
  "technical": "Detailed technical explanation with math/code"
}
```

Notes:

* No code fences
* No commentary
* Metadata enables correlation and evolution

---

### 7.2 Parsing Pipeline

1. Strip code fences if present
2. Extract first `{` → last `}`
3. Attempt JSON.parse
4. Repair common issues (quotes, commas, newlines)
5. Validate schema
6. Persist raw output regardless of success

Failures are **explicit**, never silent.

---

## 8. Data Models (Revised)

### 8.1 Knowledge Graph

```ts
export type NodeStatus =
  | 'waiting'
  | 'ok'
  | 'partial'
  | 'parse_failed'
  | 'timeout';

export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  sessionId: string;
  topic: string;

  content?: {
    simple: string;
    technical: string;
  };

  raw?: string;
  status: NodeStatus;
  promptVersion: number;

  createdAt: number;
  depth: number;
}
```

*UI state (expanded, selected) is NOT persisted.*

---

### 8.2 Chat Session

```ts
export interface ChatSession {
  id: string;
  platform: 'chatgpt' | 'gemini';
  title: string;
  originUrl: string;
  tabId?: number;
  lastActive: number;
}
```

---

## 9. UX Failsafes (Non-Negotiable)

* Manual “Copy Prompt” fallback
* “Paste JSON Here” recovery UI
* Clear node status indicators
* Retry parsing without re-injecting
* Retry generation explicitly

---

## 10. MV3 Lifecycle Guarantees

* Side Panel renders from IndexedDB alone
* Background is opportunistic, not authoritative
* Content Script assumes refresh at any time
* All critical actions are idempotent

---

## 11. Directory Structure

```text
src/
├── background/
│   ├── index.ts
│   ├── jobs.ts
│   ├── parser.ts
│   └── selectors.ts
├── content/
│   ├── index.ts
│   ├── adapters/
│   │   ├── chatgpt.ts
│   │   └── gemini.ts
│   ├── observer.ts
│   └── injector.ts
├── sidepanel/
│   ├── components/
│   ├── hooks/
│   └── App.tsx
├── db/
│   ├── index.ts
│   └── migrations.ts
├── types/
└── manifest.json
```

---

## 12. Explicit Non-Goals (v1)

* No backend sync
* No multi-device continuity
* No collaborative graphs
* No semantic embeddings

---

## 13. Summary

This architecture treats:

* **DOMs as hostile**
* **LLMs as unreliable**
* **Users as impatient but forgiving if informed**

Knowledge-Sidecar succeeds not by perfect automation, but by **never losing the learning state**, even when automation fails.
