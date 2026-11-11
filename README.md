# PeopleSphere AI: Personalized HR Assistant

A full-stack, enterprise-grade Personalized HR Assistant built from scratch. It empowers employees to query company HR policies while retrieving their individual employee records (leave balances, medical usage, reporting manager) to generate grounded, personalized answers with exact document citations.

Built with a strong focus on simplicity, maintainability, strict data isolation, defense-in-depth security, and effortless deployment with Docker Compose.

---

## 1. Key Features & User Roles

### 👩‍💼 HR Administrator (`admin@gmail.com`)
- **Document Management**: Upload company policy PDFs through the UI.
- **Section-Aware Ingestion**: Automatically analyzes document typography, detects structural section headings, and generates breadcrumbed atomic chunks.
- **Hybrid RAG Indexing**: Indexes dense vector embeddings into ChromaDB and prepares chunks for sparse keyword matching.
- **Document Oversight**: View indexed documents, chunk counts, file sizes, and delete documents with instant removal from ChromaDB.
- **Employee Record Management**: View all employee records and update designations, department, reporting managers, or leave balances stored in SQLite.
- **Employee Provisioning & RBAC Management**: Add new employees directly into the employee directory with initial credentials, custom department assignments, and leave balances.
- **Administrative Privilege Escalation (Step-Up Verification)**: Grant HR Administrator access or promote existing employees with industry-standard step-up password re-authentication (NIST SP 800-63B / OWASP ASVS), preventing unauthorized privilege escalation.

### 👨‍💻 Employee (`employee@gmail.com` - Jane Doe)
- **Policy Question Answering**: Ask questions about vacation rules, carry-over limits, health benefits, or remote work guidelines.
- **Personalized Answers**: Queries both the vector database (ChromaDB) and the authorized employee database (SQLite) to answer questions such as:
  - *"How many annual leave days do I have remaining?"*
  - *"Can I carry forward my remaining annual leave?"*
  - *"Who is my reporting manager?"*
  - *"What is the process for applying for annual leave?"*
- **Hybrid Memory Architecture**: Combines a short-term conversational buffer with a long-term running summary to preserve context across extended conversations without increasing API costs.
- **Substantive Document Citations**: View citations specifying the exact source document name and page number for full transparency, dynamically filtered to only cite documents genuinely referenced in the answer.
- **Employee Profile Card**: Live overview of remaining annual leave (14 days), medical leave used (3 days), and manager information.

---

## 2. Architecture & Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Clean, responsive UI with zero third-party UI framework bloat |
| **Backend** | Python 3.11 + FastAPI | Fast asynchronous REST API with Pydantic validation & background tasks |
| **LLM Engine** | Google Gemini 3.8 Flash | High-performance generation with multi-turn function calling |
| **Embeddings** | Gemini Embeddings (`gemini-embedding-001`) | Free-tier dense vector embeddings with automated retry & batching |
| **Vector Database** | ChromaDB | Persistent local vector store with Cosine distance indexing |
| **Structured Database** | SQLite | Clean, lightweight database for employee records, document metadata, and conversation summaries |
| **PDF Processing** | PyMuPDF (`fitz`) | High-performance typographical layout analysis and section extraction |
| **Retrieval Strategy** | Hybrid Search (Dense + Sparse) | 60% Dense Vector similarity + 40% BM25 keyword matching with section title boost |
| **Memory Strategy** | Hybrid Memory (Tier A + Tier B) | Verbatim sliding window + SQLite-persisted rolling summary via async background tasks |
| **Containerization** | Docker + Docker Compose | Multi-stage Dockerfiles with persistent named volumes |

---

## 3. Advanced Retrieval & Ingestion Pipeline (RAG 2.0)

### 📄 Section-Aware Chunking & Typographical Analysis
Traditional fixed-character chunking splits sentences midway and disconnects rules from their governing headings. PeopleSphere uses layout-aware PDF extraction:
1. **Dynamic Font Baseline Profiling**: Analyzes text block font sizes across the document to calculate the primary body font size.
2. **Structural Heading Detection**: Identifies headers based on font size (`fontSize > baseline * 1.15`), bold weight flags, numbered outlines (e.g. `1. `, `1.2 `, `2.1.3 `), uppercase policy identifiers, and official title blocks.
3. **Hierarchical Breadcrumbs**: Injects contextual breadcrumbs into each chunk:
   ```
   [Employee Handbook & Code of Conduct > Section 3: Disciplinary Process]
   ```
4. **Atomic Clause Integrity**: Chunks up to 1000 characters stay intact as atomic units; longer sections are split along natural sentence boundaries without fragmenting rules across chunk boundaries.

### 🔍 Hybrid Retrieval (Dense Vector + BM25 Sparse Search)
HR queries often mix semantic questions (*"Can I take time off to take care of my sick child?"*) with exact policy codes, acronyms, or proper nouns (*"AGT-POL-001"*, *"EAP"*, *"SLA"*).
- **Dense Vector Search**: ChromaDB retrieves candidate chunks with a cosine distance threshold $\le 0.50$ (similarity $\ge 50\%$).
- **Sparse Keyword Re-Ranking**: Chunks are scored for term frequency of inquiry keywords, with extra weight granted to section headings.
- **Combined Hybrid Score**:
  $$\text{Score} = 0.6 \times \text{Vector Similarity} + 0.4 \times \text{Keyword Score}$$
  Ensures the retriever captures both conceptual meaning and exact HR terminology.

### 🎯 Substantive Citation Grounding
When compound inquiries touch multiple topics where some topics are not covered by company policy (e.g. *"How many employees are there, and can they bring pets to the office?"*), naive RAG displays citations for chunks fetched during the pet search. PeopleSphere validates retrieved chunks against the model's synthesized answer:
- Only chunks whose substantive terms are genuinely referenced in the final output are shown as citations.
- Uncovered topics clearly state non-coverage without polluting the UI with irrelevant citations.

---

## 4. Hybrid Memory Strategy (Free-Tier Optimized)

To maintain conversational coherence over long conversations while strictly adhering to Gemini's 15 Requests-Per-Minute (RPM) free-tier limit, PeopleSphere implements a two-tier memory strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Inquiry                             │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Prompt Context Assembly                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Tier B: Rolling SQLite Summary (from earlier turns)    │ │
│  │   "Employee asked about annual leave policy & carryover"│ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Tier A: Verbatim Short-Term Buffer (Last 4 Messages)   │ │
│  │   User: "Can I carry it forward?"                      │ │
│  │   Assistant: "You can carry forward up to 5 days..."   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Gemini Response Generation                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
             (Immediate Response to User)
                           │
             (FastAPI Background Task)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Lazy Asynchronous Summarization:                            │
│ Triggered ONLY when ≥ 4 unsummarized messages age out.      │
│ Appends new key facts to SQLite without blocking user turn. │
└─────────────────────────────────────────────────────────────┘
```

1. **Tier A: Short-Term Buffer (Verbatim)**:
   - Keeps the last 4 messages verbatim in the conversational context.
   - Provides immediate precision for pronouns (*"it"*, *"they"*, *"that policy"*) and direct follow-ups.
2. **Tier B: Long-Term Conversational Summary (SQLite)**:
   - Persisted in the `conversation_summaries` table.
   - Prependable into the system context turn for **$0.00 cost and 0 extra API calls** on the request path.
3. **Zero Added Latency & Zero Quota Burn**:
   - The user gets their answer immediately without waiting for a summarization call.
   - Summarization runs lazily as a FastAPI `BackgroundTask` only when 4 or more unsummarized older turns accumulate, keeping RPM consumption minimal.

---

## 5. Security & Strict Data Isolation

> **[IMPORTANT] Security Design Rule:**
> **Employee-specific personal information is stored strictly in SQLite and is NEVER added to ChromaDB or embedded into the vector database.**

1. **Authentication & Identity**:
   - Authentication uses signed JWT Bearer tokens with bcrypt password hashing.
   - The backend strictly extracts user identity and role from the authenticated session token.
   - The server **never** trusts employee IDs or email addresses passed in request payloads or chat messages.
2. **Role Separation (RBAC)**:
   - Admin-only routes (`/api/documents/upload`, `/api/documents/{id}`, `/api/employees`) enforce `role == "admin"`.
   - Regular employees receive `403 Forbidden` if attempting to access admin endpoints or another employee's profile.
3. **Selective SQLite Retrieval**:
   - The question classifier detects whether a query requires personal data. Only the authenticated employee's row is fetched from SQLite and injected into the Gemini prompt context.
4. **Indirect Prompt Injection Defense**:
   - Text extracted from user uploads and chat inputs is sanitized to strip zero-width characters (`\u200b`–`\u200f`, `\ufeff`), bidirectional override exploits (`\u202a`–`\u202e`), and null bytes.
   - Native Gemini `systemInstruction` establishes strict trust boundaries: documents and user queries are treated as untrusted reference data, explicitly disallowing instructions inside documents to alter assistant behavior.
   - Chat input is capped at 2,000 characters to prevent buffer-exhaustion attacks.
5. **Administrative Privilege Escalation & Step-Up Verification**:
   - Provisioning a user with the elevated `admin` role or promoting an existing employee to administrator requires step-up authentication.
   - The acting HR Manager must confirm their current password (`admin_verification_password`).
   - Complies with NIST SP 800-63B and OWASP ASVS guidelines to prevent unauthorized privilege escalation through unattended sessions or session hijacking.
6. **Domain-Scope Boundary & Out-of-Domain Guardrails**:
   - The assistant is strictly restricted to Human Resources, employment policies, personal leave entitlements, benefits, and workplace operations.
   - General world trivia, science, politics, sports, coding tasks, or external factual queries (e.g. animal biology, world leaders) are rejected with a courteous boundary message, preventing off-topic misuse while welcoming natural greetings and polite etiquette.
7. **Demo Authentication Disclaimer**:
   - *Note: The seeded password authentication is provided for interview demonstration and testing purposes. In production, connect this layer to enterprise SSO / OAuth2 (e.g. Okta, Azure AD).*

---

## 6. Pre-Seeded Demo Accounts

The application automatically seeds exactly these two demo accounts on startup:

| Role | Email | Default Password | Details |
|---|---|---|---|
| **HR Administrator** | `admin@gmail.com` | `Admin@123` | HR Operations Manager (Full Admin Access) |
| **Employee** | `employee@gmail.com` | `Employee@123` | Jane Doe (Senior Engineer, 14 Annual Leave Days, 3 Medical Days) |

---

## 7. Quick Start with Docker (Recommended)

### Prerequisites
- Docker & Docker Compose installed and running.
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Step 1: Clone and Configure Environment
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...
```

### Step 2: Build and Run with Docker Compose
```bash
docker compose up --build
```

### Step 3: Access the Application
- **Frontend UI**: [http://localhost:3001](http://localhost:3001) (or `http://localhost:3000` if port 3000 is free)
- **Backend API & Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **API Health Check**: [http://localhost:8001/api/health](http://localhost:8001/api/health)

### Stopping and Preserving Data
To stop the application while preserving your uploaded PDFs, SQLite data, and ChromaDB vector indices:
```bash
docker compose down
```
When you run `docker compose up` again, all data persists across container restarts thanks to Docker volumes (`peoplesphere_sqlite_data`, `peoplesphere_chroma_data`, `peoplesphere_uploads_data`).

---

## 8. Running Locally Without Docker

### Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
# Open a new terminal in frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Automated Test Suite

A concise, comprehensive test suite validates core architecture requirements:
1. **Authentication & Role Separation** (`test_auth.py`): Verifies JWT tokens, password checks, and 403 Forbidden enforcement on admin endpoints.
2. **Employee Data Isolation** (`test_isolation.py`): Guarantees employees can only access their own record and verifies that ChromaDB vector collection holds zero employee data.
3. **RAG & PDF Ingestion** (`test_rag.py`): Tests PyMuPDF text extraction, section-aware chunking, question classification, prompt formatting, and ChromaDB chunk additions/deletions.
4. **Hybrid Memory & Persistence** (`test_memory.py`): Tests Tier A sliding window message assembly, Tier B summary persistence in SQLite, and context reconstruction.
5. **Employee Provisioning & Step-Up Verification** (`test_employees.py`): Tests staff provisioning, email uniqueness, step-up authentication password verification when granting or escalating to admin privileges, and 403 enforcement.

Run tests:
```bash
# From workspace root
pytest backend/tests -v
```

---

## 10. Demonstration & Interview Walkthrough

To demonstrate the application during an interview:

1. **Open Frontend**: Navigate to [http://localhost:3001](http://localhost:3001).
2. **Login as Admin**: Click **"HR Administrator"** (`admin@gmail.com`).
3. **Upload Policy Documents**:
   - Under the **Policy Documents** tab, upload company policy PDFs (e.g. `Leave & Paid Time Off (PTO) Policy.pdf`).
   - Notice the document chunk count, file size, and upload timestamp appear.
4. **Switch to Employee**:
   - Click **Logout** in top right.
   - Click **"Employee: Jane Doe"** (`employee@gmail.com`).
5. **Demonstrate Personalization & RAG**:
   - Jane Doe's profile card on the left shows: **14 annual leave days remaining**, **3 medical leave days used**, and manager **Alex Johnson**.
   - Click the prompt: *"How many annual leave days do I have remaining?"*
     - The assistant responds using Jane's SQLite record: 14 days remaining.
   - Ask: *"Can I carry forward my remaining annual leave?"*
     - The assistant combines Jane's balance (14 days) with the policy (maximum 5 days carry-over) and explains that 5 days will be carried forward while the remaining 9 days will expire unless an exception is granted.
     - View the document citation: `Leave & Paid Time Off (PTO) Policy.pdf (Page 1)`.
   - Ask compound or out-of-scope inquiries:
     - *"How many employees are there in the company? And can they bring pets to the office?"*
     - Assistant lists the directory employees, explains that the pet policy is not covered in company policies, and cites only the relevant directory document.
6. **Demonstrate Security**:
   - Open browser developer tools or make a curl request with the employee token to `/api/employees` -> HTTP 403 Forbidden.
   - SQLite data is strictly isolated per user session.
