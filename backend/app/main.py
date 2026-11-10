import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.db import init_db
from app.routers import auth, employees, documents, chat

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("peoplesphere")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "=" * 68, flush=True)
    print("🚀 [STARTUP] PeopleSphere HR Assistant: Verifying System Services...", flush=True)

    # 1. Structured Database (SQLite)
    try:
        init_db()
        print("📁 [STARTUP] [1/4] SQLite Database: Ready (Tables created, Demo accounts seeded)", flush=True)
    except Exception as e:
        print(f"❌ [STARTUP] [1/4] SQLite Database Error: {e}", flush=True)

    # 2. Vector Database (ChromaDB)
    try:
        from app.services.rag import get_hr_collection
        collection = get_hr_collection()
        chunks = collection.count()
        print(f"🧠 [STARTUP] [2/4] Vector DB (ChromaDB): Ready | Collection: '{collection.name}' ({chunks} chunks indexed)", flush=True)
    except Exception as e:
        print(f"❌ [STARTUP] [2/4] Vector DB Error: {e}", flush=True)

    # 3. Embedding Model (Gemini Embedding)
    if os.getenv("TESTING", "").lower() != "true":
        try:
            from app.services.gemini import generate_single_embedding
            sample_vector = await generate_single_embedding("startup_verification_text")
            print(f"🔢 [STARTUP] [3/4] Embedding Model: Ready | Model: '{settings.GEMINI_EMBEDDING_MODEL}' (dim: {len(sample_vector)})", flush=True)
        except Exception as e:
            print(f"⚠️ [STARTUP] [3/4] Embedding Model Warning: {e}", flush=True)

        # 4. LLM Generation Model (Gemini 3.8 Flash)
        try:
            from app.services.gemini import generate_response
            test_response = await generate_response(
                prompt="Respond only with 'READY' to verify system initialization.",
                system_instruction=None,
                history=None
            )
            print(f"🤖 [STARTUP] [4/4] LLM (Gemini): Ready | Configured: '{settings.GEMINI_MODEL}' | Live Test: {test_response[:60].strip()}", flush=True)
        except Exception as e:
            print(f"⚠️ [STARTUP] [4/4] LLM Warning: {e}", flush=True)

    print("=" * 68 + "\n", flush=True)

    yield

    print("🛑 [SHUTDOWN] PeopleSphere HR Assistant shutting down cleanly...", flush=True)

app = FastAPI(
    title="PeopleSphere HR Assistant API",
    description="Personalized AI HR Assistant with RAG, SQLite Employee Management, and Gemini 3.8 Flash",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(documents.router)
app.include_router(chat.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for Docker container readiness probe."""
    return {
        "status": "healthy",
        "service": "peoplesphere-backend",
        "gemini_model": settings.GEMINI_MODEL,
        "embedding_model": settings.GEMINI_EMBEDDING_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
