# PeopleSphere AI: Personalized HR Assistant

A full-stack, enterprise-grade yet simple Personalized HR Assistant built from scratch. It empowers employees to query company HR policies while retrieving their individual employee records (leave balances, medical usage, reporting manager) to generate grounded, personalized answers with exact document citations.

Built with a strong focus on simplicity, maintainability, strict data isolation, and easy deployment with Docker Compose.

---

## 1. Key Features & User Roles

### 👩‍💼 HR Administrator (`admin@gmail.com`)
- **Document Management**: Upload company policy PDFs through the UI.
- **RAG Indexing**: Automatically extracts text with PyMuPDF, chunks policy clauses, and indexes dense vector embeddings into ChromaDB.
- **Document Oversight**: View indexed documents, chunk counts, file sizes, and delete documents with instant removal from ChromaDB.
- **Employee Record Management**: View all employee records and update designations, department, reporting managers, or leave balances stored in SQLite.

### 👨‍💻 Employee (`employee@gmail.com` - Jane Doe)
- **Policy Question Answering**: Ask questions about vacation rules, carry-over limits, health benefits, or remote work guidelines.
- **Personalized Answers**: Queries both the vector database (ChromaDB) and the authorized employee database (SQLite) to answer questions such as:
  - *"How many annual leave days do I have remaining?"*
  - *"Can I carry forward my remaining annual leave?"*
  - *"Who is my reporting manager?"*
  - *"What is the process for applying for annual leave?"*
- **Conversational Context**: Preserves conversation history for natural follow-up questions.
- **Document Citations**: View citations specifying the exact source document name and page number for full transparency.
- **Employee Profile Card**: Live overview of remaining annual leave (14 days), medical leave used (3 days), and manager information.

---

## 2. Mandatory Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Clean, responsive UI with zero third-party UI framework bloat |
| **Backend** | Python 3.11 + FastAPI | Fast asynchronous REST API with Pydantic validation |
| **LLM** | Google Gemini 3.8 Flash | Configurable via `.env` (`gemini-3.8-flash` with graceful fallbacks) |
| **Embedding Model** | Gemini Embedding Model | Free Gemini embeddings (`gemini-embedding-001` / `gemini-embedding-2`) |
| **Vector Database** | ChromaDB | Persistent local vector store for HR policy chunks |
| **Structured Database** | SQLite | Clean, lightweight database for employee records and document metadata |
| **PDF Processing** | PyMuPDF (`fitz`) | High-performance PDF text extraction and chunk segmentation |
| **RAG Pipeline** | Pure Python Functions | Simple, transparent, beginner-friendly RAG (no heavy agent wrappers) |
| **Containerization** | Docker + Docker Compose | Multi-stage Dockerfiles with persistent named volumes |

---

## 3. Security & Strict Data Isolation

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
4. **Demo Authentication Disclaimer**:
   - *Note: The seeded password authentication is provided for interview demonstration and testing purposes. In production, connect this layer to enterprise SSO / OAuth2 (e.g. Okta, Azure AD).*

---

## 4. Pre-Seeded Demo Accounts

The application automatically seeds exactly these two demo accounts on startup:

| Role | Email | Default Password | Details |
|---|---|---|---|
| **HR Administrator** | `admin@gmail.com` | `Admin@123` | HR Operations Manager (Full Admin Access) |
| **Employee** | `employee@gmail.com` | `Employee@123` | Jane Doe (Senior Engineer, 14 Annual Leave Days, 3 Medical Days) |

---

## 5. Quick Start with Docker (Recommended)

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

## 6. Running Locally Without Docker

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

## 7. Automated Test Suite

A concise, meaningful test suite validates core architecture requirements:
1. **Authentication & Role Separation** (`test_auth.py`): Verifies JWT tokens, password checks, and 403 Forbidden enforcement on admin endpoints.
2. **Employee Data Isolation** (`test_isolation.py`): Guarantees employees can only access their own record and verifies that ChromaDB vector collection holds zero employee data.
3. **RAG & PDF Ingestion** (`test_rag.py`): Tests PyMuPDF text extraction, question classification, prompt formatting, and ChromaDB chunk additions/deletions.

Run tests:
```bash
# From workspace root
pytest backend/tests -v
```

---

## 8. Demonstration & Interview Walkthrough

To demonstrate the application during an interview:

1. **Open Frontend**: Navigate to [http://localhost:3001](http://localhost:3001).
2. **Login as Admin**: Click **"HR Administrator"** (`admin@gmail.com`).
3. **Upload Sample Policy**:
   - Under the **Policy Documents** tab, choose `sample_policies/Company_Leave_Policy.pdf` and click **Upload & Index**.
   - Notice the document chunk count, file size, and upload timestamp appear.
4. **Switch to Employee**:
   - Click **Logout** in top right.
   - Click **"Employee: Jane Doe"** (`employee@gmail.com`).
5. **Demonstrate Personalization & RAG**:
   - Notice Jane Doe's profile card on the left shows: **14 annual leave days remaining**, **3 medical leave days used**, and manager **Alex Johnson**.
   - Click the prompt: *"How many annual leave days do I have remaining?"*
     - The assistant responds using Jane's SQLite record: 14 days remaining.
   - Ask: *"Can I carry forward my remaining annual leave?"*
     - The assistant combines Jane's balance (14 days) with the policy (maximum 5 days carry-over) and explains that 5 days will be carried forward while the remaining 9 days will expire unless an exception is granted.
     - View the document citation: `Company_Leave_Policy.pdf (Page 1)`.
   - Ask: *"Who is my reporting manager and how do I apply for leave?"*
     - The assistant states her manager is Alex Johnson and quotes the application timeline from Section 1.2 of the policy.
6. **Demonstrate Security**:
   - Open browser developer tools or make a curl request with the employee token to `/api/employees` -> HTTP 403 Forbidden.
   - SQLite data is strictly isolated per user session.

