"""
FocusFlow Authentication API - Main Application

A FastAPI-based backend for the FocusFlow AI Learning Companion with modular architecture.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth_router

# Initialize database
init_db()

# Create FastAPI application
app = FastAPI(
    title="FocusFlow API",
    description="Authentication and services API for FocusFlow AI Learning Companion",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "FocusFlow API",
        "version": "1.0.0",
        "database": "PostgreSQL"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "api_version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
