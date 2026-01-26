# PRODUCT POSTER: The Knowledge Sidecar

**Product Type:** Chrome Extension
**Target Platforms:** ChatGPT (`chatgpt.com`), Gemini (`gemini.google.com`)
**Core Value:** Recursive Learning & Spatial Context

---

## 1. Problem Statement
**The "Recursive Prerequisite" Gap:**
This problem was identified through the specific struggle of reading dense technical papers (e.g., "All You Need Is Attention"). To understand the main topic, a user must grasp multiple layers of prerequisite concepts (e.g., Transformers $\to$ Self-Attention $\to$ Softmax $\to$ Dot Product).

* **The Discovery:** Current LLM chats are **linear**, but deep learning is **hierarchical**. When users ask about a sub-concept, the chat pushes the original topic off-screen. After 3-4 layers of "What is X?", the user loses the context of *why* they asked about X in the first place.
* **The Missing State:** Users need a way to explore the "web of knowledge" starting from a top-level topic, efficiently navigating down through the chain of prerequisites to build a foundation, and then seamlessly climbing back up to comprehend the original topic.

## 2. Primary Persona & Jobs to be Done (JTBD)

**The Persona: "The Dangerous Generalist"**
* **Who:** Product Managers, Founders, Solutions Engineers.
* **Goal:** Quickly build a "minimum viable understanding" of a complex domain to make strategic decisions.

**Key JTBDs:**
* **"Unblock the Path":** *When* I am researching a complex topic and hit a jargon/concept that blocks my understanding, *I want* to instantly access an explanation of that specific "blocker," *so that* I can continue reading without switching contexts.
* **"Build the Foundation":** *When* the explanation of a concept reveals *further* unknown concepts, *I want* to traverse down the chain of prerequisites until I reach ground truth, *so that* I can mentally construct the full picture needed to understand the original topic.
* **"Maintain the Stack":** *When* I am deep in a rabbit hole of sub-concepts, *I want* to visualize my path and easily navigate back to the parent topics, *so that* I don't lose track of my primary learning goal.

## 3. Current Workflow (The Pain)
**The "Stack Overflow" of Context:**
1.  **Action:** User asks about "Transformer Architecture." Response mentions "Self-Attention."
2.  **Friction:** User asks "What is Self-Attention?" Response mentions "Query, Key, Value vectors." User asks about those.
3.  **Pain:** The user is now 3 layers deep in a linear chat. The original definition of "Transformers" is lost 5 scrolls up.
4.  **Cost:** Mental fatigue. The user struggles to connect the definition of "Vectors" back to "Transformers" because the spatial link is broken.

## 4. Product Vision
**"The Recursive Knowledge Navigator"**
We are building a **Chrome Extension** that augments linear chat interfaces with a **Spatial Knowledge Graph**. It transforms a standard chat into a "drill-down" learning engine.

**How It Works:**
* **Proactive Highlighting:** The extension detects key technical terms in the LLM's response that are likely prerequisites.
* **Sidebar Expansion:** Clicking a term does *not* clutter the main chat. It opens a dedicated card in the **Chrome Side Panel** with a focused explanation.
* **The Tree of Knowledge:** As the user clicks deeper (Concept A $\to$ Concept B $\to$ Concept C), the Side Panel visualizes this path as a **Git-style branch**.
* **Navigation:** Users can click up and down this tree to refresh their memory of parent concepts, ensuring they can "pop the stack" and return to the main topic with full understanding.

## 5. Key User Journey (The "New World")

### Step 1: The Encounter
**Context:** User is reading a response about "Modern AI Architectures" in ChatGPT.
**Action:** The user sees the term "Embeddings" highlighted but doesn't fully grasp it.

### Step 2: The Drill-Down
**Action:** User clicks "Embeddings".
**System:** The **Side Panel** opens (or updates). A new node is added to the graph: `AI Architectures > Embeddings`. The panel displays a concise definition of Embeddings.

### Step 3: The Recursive Step
**Context:** The definition of Embeddings mentions "Vector Space." The user doesn't know that either.
**Action:** User clicks "Vector Space" *inside the Side Panel*.
**System:** A new child node is added: `AI Architectures > Embeddings > Vector Space`. The view updates to explain Vector Spaces.

### Step 4: The Ascent (Synthesis)
**Context:** User now understands Vector Spaces and Embeddings.
**Action:** User clicks the **Top Node** ("AI Architectures") in the graph history.
**System:** The Side Panel restores the original context. The user now reads the original text with the mental foundation secured, ready to move forward.