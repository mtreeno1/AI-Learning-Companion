"""
FastAPI Application Configuration
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost/focusflow"
    )
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001"
    ]
    
    # Security
    TOKEN_EXPIRY_DAYS: int = 7
    
    class Config:
        env_file = ".env"


settings = Settings()
