"""
FastAPI Application Configuration
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost/focusflow"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )
    
    # Security
    TOKEN_EXPIRY_DAYS: int = 7
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
