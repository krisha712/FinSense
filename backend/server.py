from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize database
from database import init_db
from init_demo import init_demo_data

app = FastAPI(title="FinSense API", version="3.0.0")

CORS_ORIGINS = [origin.strip() for origin in os.environ.get(
    'CORS_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',') if origin.strip()]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.expense_routes import router as expense_router
from routes.analytics_routes import router as analytics_router
from routes.insights_routes import router as insights_router
from routes.google_auth_routes import router as google_auth_router
from routes.rolling_budget_routes import router as rolling_budget_router

# Include routers
app.include_router(auth_router)
app.include_router(google_auth_router)
app.include_router(user_router)
app.include_router(expense_router)
app.include_router(analytics_router)
app.include_router(insights_router)
app.include_router(rolling_budget_router)

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("FinSense API v3.0 Starting...")
    logger.info("=" * 60)
    
    # Import all models so Base.metadata is complete
    import models  # noqa: F401

    # Initialize database tables
    init_db()
    logger.info("Database initialized")

    # Seed demo account
    init_demo_data()
    logger.info("Demo data ready")

    logger.info("=" * 60)

@app.get("/api/")
async def root():
    return {
        "data": {"message": "FinSense API v3.0 — Multi-user with persistence"},
        "metadata": {},
        "error": None
    }

@app.get("/api/health")
async def health():
    from database import SessionLocal
    from models import Expense
    
    db = SessionLocal()
    try:
        count = db.query(Expense).count()
        return {
            "data": {
                "ok": True,
                "data_loaded": True,
                "expenses_count": count
            },
            "metadata": {"version": "3.0.0"},
            "error": None
        }
    finally:
        db.close()
