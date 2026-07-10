<div align="center">

# ⚖️ Sahur AI
### Constitutional Rights & Statutory Compliance Analyzer for India

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com/meeh16/THE-GOAT)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express)](https://expressjs.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini_AI-Powered-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

> **Sahur AI** is an AI-powered Indian legal compliance system that helps everyday citizens understand their constitutional rights, analyze contracts for illegal clauses, and navigate complex legal disputes — all grounded in actual Indian statutes via RAG (Retrieval-Augmented Generation).

[🚀 Getting Started](#-getting-started) · [🏗 Architecture](#-architecture) · [🔌 API Reference](#-api-reference) · [🧩 Component Docs](#-component-documentation)

</div>

---

## 📋 Table of Contents

1. [Overview & Features](#-overview--features)
2. [Tech Stack](#-tech-stack)
3. [Getting Started](#-getting-started)
4. [Architecture](#-architecture)
5. [Project Structure](#-project-structure)
6. [Server Functions](#-server-functions-servertsts)
7. [API Reference](#-api-reference)
8. [Component Documentation](#-component-documentation)
9. [Frontend Functions (App.tsx)](#-frontend-functions-apptsx)
10. [Data Flow](#-data-flow)
11. [Environment Variables](#-environment-variables)

---

## ✨ Overview & Features

Sahur AI provides legal reasoning grounded in actual Indian law across **4 major domains**:

| Domain | Scope |
|---|---|
| 🏠 **Tenancy** | Rental agreements, security deposits, evictions, rent control |
| 💼 **Workplace** | Job protection, wages, illegal termination, POSH, maternity rights |
| 👮 **Policing** | Constitutional safeguards (Articles 20, 21, 22), illegal detentions, arrest rights |
| 🛒 **Consumer Rights** | Defective goods, refunds, deceptive services under CoPRA 2019 |

### Key Features

- 🔍 **AI Clause Extraction** — Scans uploaded contracts and flags illegal/suspicious clauses using Gemini AI
- 📊 **Explainability Tree** — Step-by-step legal audit trail with `pass/fail/info` statuses per statutory check
- 🌡️ **Rights Heatmap** — Visual map of fundamental rights affected: `secure / compromised / violated`
- 🧪 **What-If Simulator** — Compare legal outcomes under different fact scenarios
- 💬 **Interactive Chat** — Context-aware AI legal companion grounded in Indian statutes
- 📄 **Compliance Passport** — Downloadable TXT / printable PDF legal compliance certificate
- 🗄️ **Legal Vault** — Personal secure document storage with AI clause analysis
- 🔑 **Custom API Key** — Support for user-provided Gemini keys for dedicated quotas

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express 4.21 |
| **AI Engine** | Google Gemini AI (`@google/genai` v2.4) |
| **Database** | JSON flat-file (`server_data/db.json`) |
| **Knowledge Base** | Curated static Legal KB (`server/legal_kb.json`) |
| **Build Tool** | Vite (frontend) + esbuild (backend bundling) |
| **Runtime** | `tsx` for development, Node.js for production |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/meeh16/THE-GOAT
cd THE-GOAT

# Install all dependencies
npm install

# Configure environment
cp .env.example .env
# Open .env and add: GEMINI_API_KEY=your_key_here
```

### Running Locally

```bash
# Start development server (frontend + backend unified)
npm run dev
```

The app runs at **http://localhost:3000**

### Production Build

```bash
# Build frontend + bundle server
npm run build

# Start production server
npm run start
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SAHUR AI — SYSTEM ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────┘

  BROWSER (React SPA)
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
  │  │  Evaluate    │  │  Legal Vault  │  │   AI Companion   │  │
  │  │  Scenario    │  │  (VaultMgr)   │  │  (InteractChat)  │  │
  │  │   Tab        │  │   Tab         │  │    Tab           │  │
  │  └──────┬───────┘  └──────┬────────┘  └──────┬─────────┘  │
  │         │                 │                    │            │
  │  ┌──────▼─────────────────▼────────────────────▼──────────┐  │
  │  │                     App.tsx (Root)                     │  │
  │  │  State: documents, analyses, scenario, selectedDocIds  │  │
  │  └────────────────────────┬───────────────────────────────┘  │
  │                           │                                  │
  │  ┌────────────────────────▼───────────────────────────────┐  │
  │  │          Sub-Components (Result Display)               │  │
  │  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
  │  │  │Explainability│  │   Rights    │  │   What-If   │  │  │
  │  │  │     Tree     │  │   Heatmap   │  │  Simulator  │  │  │
  │  │  └──────────────┘  └─────────────┘  └──────────────┘  │  │
  │  │  ┌──────────────┐                                      │  │
  │  │  │  Analysis    │                                      │  │
  │  │  │  History     │                                      │  │
  │  │  └──────────────┘                                      │  │
  │  └────────────────────────────────────────────────────────┘  │
  └───────────────────────────┬──────────────────────────────────┘
                              │ HTTP fetch API
                              │ Header: x-gemini-api-key (optional)
  ┌───────────────────────────▼──────────────────────────────────┐
  │                  EXPRESS SERVER (server.ts)                   │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │                    API ROUTES                          │  │
  │  │  GET  /api/vault          -> List all vault docs       │  │
  │  │  POST /api/vault/upload   -> Clause extraction         │  │
  │  │  DEL  /api/vault/:id      -> Remove vault doc          │  │
  │  │  POST /api/analyze        -> Core legal analysis (RAG) │  │
  │  │  GET  /api/analyses       -> History of analyses       │  │
  │  │  DEL  /api/analyses/:id   -> Remove saved analysis     │  │
  │  │  POST /api/simulate       -> What-If comparator        │  │
  │  │  POST /api/chat           -> AI chat assistant         │  │
  │  └──────────────────────┬─────────────────────────────────┘  │
  │                         │                                    │
  │  ┌──────────────────────▼─────────────────────────────────┐  │
  │  │              CORE SERVER HELPERS                       │  │
  │  │  getAiClient()                -> Gemini client         │  │
  │  │  generateContentWithFallback() -> Retry + model chain  │  │
  │  │  retrieveLegalDocuments()     -> RAG keyword search    │  │
  │  │  readDB() / writeDB()         -> JSON persistence      │  │
  │  │  loadKB()                     -> Load legal_kb.json    │  │
  │  └──────────────────────┬─────────────────────────────────┘  │
  └─────────────────────────┼──────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
  ┌───────────▼──────────┐   ┌────────────▼──────────────┐
  │  Google Gemini API   │   │  Local File System         │
  │  (gemini-3.5-flash)  │   │  server_data/db.json       │
  │  - generateContent   │   │  server/legal_kb.json      │
  └──────────────────────┘   └───────────────────────────┘
```

---

## 📁 Project Structure

```
THE-GOAT/
├── server.ts                  # Express backend + all API routes + AI helpers
├── index.html                 # SPA HTML shell
├── vite.config.ts             # Vite + Tailwind plugin config
├── tsconfig.json              # TypeScript configuration
├── package.json               # Scripts and dependencies
├── .env                       # GEMINI_API_KEY (not committed)
├── .env.example               # Environment template
│
├── src/
│   ├── App.tsx                # Root React component, global state, tab routing
│   ├── index.css              # Global Tailwind + custom styles
│   ├── main.tsx               # React DOM entry point
│   ├── types.ts               # Shared TypeScript type definitions
│   └── components/
│       ├── VaultManager.tsx        # Legal document vault UI + upload
│       ├── InteractiveChat.tsx     # AI chat companion UI
│       ├── ExplainabilityTree.tsx  # Step-by-step audit tree display
│       ├── RightsHeatmap.tsx       # Fundamental rights status grid
│       ├── WhatIfSimulator.tsx     # Scenario comparison tool
│       └── AnalysisHistory.tsx     # Past analyses sidebar
│
├── server/
│   └── legal_kb.json          # Curated Indian legal knowledge base (RAG source)
│
└── server_data/
    └── db.json                # Runtime database (vault + analyses + chats)
```

---

## 🔧 Server Functions (`server.ts`)

### `getAiClient(customApiKey?)`

```typescript
function getAiClient(customApiKey?: string): GoogleGenAI
```

**Purpose:** Returns a `GoogleGenAI` client instance. Supports per-request custom API keys (forwarded from the frontend via `x-gemini-api-key` header) to give users dedicated Gemini quota.

**Logic:**
1. If a valid `customApiKey` is provided → creates a fresh client with that key
2. Otherwise → returns the cached `defaultAi` singleton, initialized from `process.env.GEMINI_API_KEY`
3. If no key is available at all, the singleton uses a fallback stub (server starts but AI calls will fail until a key is provided)

---

### `generateContentWithFallback(params, customApiKey?, retries, delayMs)`

```typescript
async function generateContentWithFallback(
  params: any,
  customApiKey?: string,
  retries = 2,
  delayMs = 1000
): Promise<GenerateContentResponse>
```

**Purpose:** Wraps Gemini `generateContent` with **automatic retry + model cascade fallback** to gracefully handle rate limits and service overloads.

**Model Fallback Chain:**
```
gemini-3.5-flash → gemini-flash-latest → gemini-3.1-flash-lite
```

**Logic flow:**
1. Normalizes the requested model name (maps deprecated names to current ones)
2. Deduplicates the fallback list with `Array.from(new Set(...))`
3. For each model, attempts up to `retries` times
4. Transient errors (503 / 429 / UNAVAILABLE) wait `delayMs * attempt` ms before retrying
5. Non-transient errors immediately skip to the next model in the chain
6. If all models and retries are exhausted, throws the last captured error

---

### `readDB()`

```typescript
function readDB(): { vault: any[], saved_analyses: any[], chats: Record<string, any[]> }
```

**Purpose:** Reads and parses the flat JSON database file (`server_data/db.json`).

Returns a deep copy of `DEFAULT_DB` if the file doesn't exist or is corrupted, preventing crashes on first run.

---

### `writeDB(data)`

```typescript
function writeDB(data: typeof DEFAULT_DB): void
```

**Purpose:** Serializes and persists the in-memory state back to `db.json` with 2-space indentation for human readability.

---

### `loadKB()`

```typescript
function loadKB(): LegalKBDocument[]
```

**Purpose:** Loads the curated Indian legal knowledge base from `server/legal_kb.json`. Returns an empty array on failure so the server continues operating even if the KB file is missing.

---

### `retrieveLegalDocuments(query, domain?, limit)`

```typescript
function retrieveLegalDocuments(
  query: string,
  domain?: string,
  limit = 3
): LegalKBDocument[]
```

**Purpose:** The **RAG (Retrieval-Augmented Generation) search engine**. Finds the most relevant Indian legal documents from the local knowledge base to ground AI responses.

**Scoring Algorithm:**

| Match Type | Score Weight |
|---|---|
| Domain match (exact) | +5 bonus |
| Keyword hit in `text` | +1 per occurrence |
| Keyword hit in `title` | +2 per occurrence |
| Keyword hit in `statute` | +3 per occurrence |

**Logic:**
1. Tokenizes query into words ≥ 3 characters using regex `\b\w{3,}\b`
2. Scores every KB document with the weights above
3. Filters out zero-score documents (unless they match the domain directly)
4. Sorts by score descending, returns top `limit` results

---

### `startServer()`

```typescript
async function startServer(): Promise<void>
```

**Purpose:** Bootstraps the Express server with environment-aware frontend serving.

**Modes:**
- **Development** (`NODE_ENV !== "production"`): Integrates Vite dev server as middleware — enables HMR and instant rebuilds
- **Production**: Serves the pre-built `dist/` folder as static assets; sends `index.html` for all routes (SPA fallback)

Binds on `0.0.0.0:3000` for container/cloud compatibility.

---

## 🔌 API Reference

### `GET /api/vault`
Returns all documents stored in the user's legal vault.

**Response:** `VaultDocument[]`

---

### `POST /api/vault/upload`
Uploads a legal document and triggers **AI clause extraction** using Gemini.

**Request Body:**
```json
{
  "name": "Lease_Agreement.txt",
  "type": "Rental Agreement",
  "content": "Full text of the document...",
  "size": 2840
}
```

**What it does:**
1. Takes the first 4,000 characters as a sample for efficient analysis
2. Sends to Gemini with a specialized clause-extraction system prompt
3. Gemini returns structured JSON: `documentType`, `overallVerdict`, and `clauses[]`
4. Each clause has: `topic`, `text`, `legalStanding` (`lawful | unlawful | suspicious`), `explanation`
5. The document + AI result is saved to `db.json` and returned to the frontend

**Overall Verdict values:**

| Value | Meaning |
|---|---|
| `good_to_go` | No illegal clauses detected |
| `review_needed` | Suspicious or unfair clauses found |
| `critical_issues` | Clauses directly violate mandatory Indian law |

---

### `DELETE /api/vault/:id`
Removes a document from the vault by its ID.

---

### `POST /api/analyze`
**The core analysis pipeline.** Evaluates a citizen's legal scenario with full RAG grounding.

**Request Body:**
```json
{
  "scenario": "My landlord locked me out with 1 day verbal notice...",
  "vaultDocIds": ["doc_1720123456789"],
  "clarifyingAnswers": [
    { "question": "Was there a written agreement?", "answer": "Yes" }
  ],
  "domain": "tenancy"
}
```

**Processing Pipeline:**
```
1. Domain Classification
   └── Keyword heuristic (landlord/tenant/salary/arrest/product...)

2. RAG Retrieval
   └── retrieveLegalDocuments(scenario, domain, 3)
       └── Injects top 3 statute snippets into the prompt

3. Vault Context Building
   └── Fetches linked VaultDocument clauses + first 3000 chars

4. Gemini Analysis (structured JSON output, 11 fields)

5. Persist to db.json & return to frontend
```

**Verdict values:**

| Value | Meaning |
|---|---|
| `compliant` | Situation aligns with statutory protections |
| `needs_review` | Suspicious elements, no confirmed illegal act |
| `violation` | Direct breach of Indian statutory/constitutional law |

---

### `GET /api/analyses`
Returns all saved analysis records for the history sidebar.

---

### `DELETE /api/analyses/:id`
Removes a saved analysis by ID.

---

### `POST /api/simulate`
**What-If legal simulator.** Compares legal outcomes between an original scenario and a modified "what if" version.

**Request Body:**
```json
{
  "scenario": "Landlord evicted without notice...",
  "alteredFacts": "What if the landlord gave 30 days written notice?",
  "vaultDocIds": []
}
```

**Response:**
```json
{
  "initialVerdict": "violation",
  "simulatedVerdict": "compliant",
  "initialScore": 20,
  "simulatedScore": 85,
  "shiftExplanation": "With 30 days written notice, the Model Tenancy Act...",
  "rightsImpactDifference": "Right to Quiet Enjoyment shifts from violated to secure",
  "recommendationShift": "No need to approach Rent Authority if notice was served properly"
}
```

---

### `POST /api/chat`
Conversational AI legal assistant with context awareness.

**Request Body:**
```json
{
  "message": "Is a 10-month security deposit legal in India?",
  "history": [
    { "role": "user", "content": "What is Article 21?" },
    { "role": "assistant", "content": "Article 21 guarantees..." }
  ],
  "scenario": "Linked scenario text (optional)",
  "vaultDocIds": ["doc_id_1"]
}
```

**Logic:**
1. Loads any linked vault documents and formats their clauses as context
2. Reconstructs conversation history as a formatted string prefix
3. Sends to Gemini with a strict, anti-slop system prompt grounded in Indian law
4. Returns plain text `reply`

---

## 🧩 Component Documentation

### `VaultManager.tsx`

The legal document management panel. Allows uploading, viewing, and deleting documents from the personal vault.

**Props:**
```typescript
{
  documents: VaultDocument[];
  onUploadSuccess: (doc: VaultDocument) => void;
  onDeleteSuccess: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}
```

#### `handleUploadAPI(name, type, content, size)`
Core upload function. Reads the custom API key from `localStorage`, sends a `POST /api/vault/upload` request, and calls `onUploadSuccess` on completion.

#### `handlePresetSelect(preset)`
Instantly loads one of 3 bundled preset contracts (Lease Agreement, Employment Contract, Electronics Invoice) and triggers the upload/analysis pipeline — designed for quick demo and testing.

#### `handleManualSubmit(e)`
Form submit handler for the copy-paste text input. Wraps user-typed text in a file-like object and routes through `handleUploadAPI`.

#### `handleFileChange(e)`
File input handler. Uses `FileReader.readAsText()` to read uploaded `.txt/.md/.docx` files as strings, then routes through `handleUploadAPI`.

#### `onDragOver / onDragLeave / onDrop`
Drag-and-drop event handlers for the dropzone. Sets `isDragging` state for visual feedback and processes the dropped file identically to `handleFileChange`.

#### `handleDelete(id, e)`
Prompts for confirmation, then calls `DELETE /api/vault/:id`. Uses `e.stopPropagation()` to prevent triggering the document viewer when clicking the delete icon inside a document card.

---

### `InteractiveChat.tsx`

Real-time chat interface for the AI legal companion. Maintains conversation history in local state and sends it with each message for context continuity.

**Props:**
```typescript
{
  documents: VaultDocument[];
  currentScenario?: string;
  vaultDocIds: string[];
  setVaultDocIds: React.Dispatch<React.SetStateAction<string[]>>;
}
```

#### `handleSend(e)`
The primary chat send handler:
1. Prevents duplicate sends if already loading
2. Creates a `ChatMessage` object with a `Date.now()` ID
3. Optimistically adds the user message to local state
4. Sends the entire `messages` history with the new message to `POST /api/chat`
5. Appends the AI `reply` (or error message) to conversation state

#### `toggleDocLink(id)`
Toggles a vault document's ID in `vaultDocIds` — linking/unlinking it as context for the AI chat session.

#### Auto-scroll (useEffect)
Auto-scrolls the chat window to the latest message whenever `messages` or `isLoading` changes, using `messagesEndRef`.

---

### `ExplainabilityTree.tsx`

Displays the step-by-step legal audit trail returned by `POST /api/analyze`. Each node represents one legal check with a `pass / info / fail` status and a statutory citation.

---

### `RightsHeatmap.tsx`

Renders a visual grid of fundamental constitutional rights affected by the analyzed scenario. Each right shows its status (`secure`, `compromised`, `violated`) with color coding and the constitutional reference (e.g. Article 21, CoPRA Section 2(9)).

---

### `WhatIfSimulator.tsx`

Provides a side-by-side comparison UI for the `POST /api/simulate` endpoint. Users enter "altered facts" and see score deltas and verdict changes with a shift explanation.

---

### `AnalysisHistory.tsx`

Sidebar list of all past analyses loaded from `GET /api/analyses`. Clicking an analysis restores it as the active result. Supports deletion via the server API.

---

## 📱 Frontend Functions (`App.tsx`)

### `getHeaders(extraHeaders?)`
Reads the custom Gemini API key from `localStorage` and injects it as the `x-gemini-api-key` request header for all API calls. Allows users to bypass shared-quota rate limits.

---

### `fetchVault()`
Loads all vault documents from `GET /api/vault` on app mount and populates the `documents` state.

---

### `fetchAnalyses()`
Loads all saved analyses from `GET /api/analyses` on app mount for the history sidebar.

---

### `runAnalysis(customAnswers?)`
The primary analysis trigger. Posts the current scenario, selected vault doc IDs, and optional clarifying answers to `POST /api/analyze`. On success:
- Sets `activeAnalysis` (shows the result panel)
- Prepends the new analysis to the `analyses` history
- If the AI responds with `missing_info` questions and no answers were provided, pre-populates the clarifying form fields

---

### `submitClarifications(e)`
Converts the `clarifyingAnswers` state dictionary into an array of `{ question, answer }` objects and re-runs the analysis with this additional context.

---

### `handleSelectScenarioPreset(presetText)`
Loads a prebuilt scenario text into the input field. Also performs a fuzzy match to auto-link a relevant vault document if one exists.

---

### `toggleDocSelection(id)`
Toggles a vault document's selection state for being linked to the current analysis.

---

### `downloadPlainTextReport()`
Generates a formatted plain-text "Compliance Passport" from the active analysis result and triggers a browser file download as `.txt`. Includes: citizen details, summary, cited rights, statutes, evidence checklist, and escalation authority.

---

### `getDomainStyles(domain)`
Returns Tailwind CSS class sets for color-coding the UI based on the legal domain:

| Domain | Color |
|---|---|
| `tenancy` | Teal |
| `workplace` | Blue |
| `policing` | Purple |
| `consumer` | Orange |

---

## 🔄 Data Flow

```
User Types Scenario
        │
        ▼
  runAnalysis()
        │
        ▼
POST /api/analyze
        │
        ├── 1. Domain Classification (keyword heuristic)
        │
        ├── 2. retrieveLegalDocuments()
        │       └── Scores all KB entries → top 3 statutes
        │
        ├── 3. Build Vault Context
        │       └── Clauses from linked VaultDocuments
        │
        ├── 4. Gemini generateContent()
        │       └── generateContentWithFallback() wraps it
        │
        ├── 5. Parse JSON response (11 fields)
        │
        └── 6. writeDB() → return to frontend
                │
                ▼
        App.tsx sets activeAnalysis
                │
                ├── ExplainabilityTree  (explainability_tree[])
                ├── RightsHeatmap       (rights_heatmap[])
                ├── Applicable Laws tab (applicable_laws[])
                ├── Evidence Checklist  (evidence_checklist[])
                └── Authority Recommendation
```

---

## 🌍 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for server-side AI calls |
| `NODE_ENV` | Optional | Set to `production` to disable Vite middleware and serve `dist/` |

> **💡 User-provided keys:** Users can also provide their own Gemini key via the app's API Key Settings modal. It is stored in `localStorage` and forwarded on every request as the `x-gemini-api-key` header, bypassing the server default.

---

## 📜 Legal Disclaimer

Sahur AI is an **automated legal knowledge retrieval system** grounded strictly in Indian Constitutional and statutory jurisprudence. All evaluations are **educational and informational only**. This system does not constitute formal attorney representation, signed court advocacy counsel, or certified legal advice.

---

<div align="center">

**Built with ⚖️ for the citizens of India**

*Powered by Google Gemini AI · RAG-grounded · Constitutional Law of India*

</div>
