from pydantic_settings import BaseSettings
from pydantic import Field
import os
import secrets

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./focusflow.db",
        description="Database URL (Railway provides this automatically)"
    )
    
    # Security - auto-generate if not provided
    SECRET_KEY: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Secret key for JWT tokens (auto-generated if not provided)"
    )
    ALGORITHM: str = Field(default="HS256")

    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    DEBUG: bool = Field(default=True, alias="DEBUG")
    ENVIRONMENT: str = Field(default="development", alias="ENVIRONMENT")

    # API - Support Railway's PORT environment variable
    API_HOST: str = "0.0.0.0"
    API_PORT: int = Field(default=8000)
    
    @property
    def get_port(self) -> int:
        """Get port from environment (Railway sets PORT) or use default"""
        return int(os.getenv("PORT", self.API_PORT))
    
    # CORS - comma-separated list in environment variable
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # Security
    TOKEN_EXPIRY_DAYS: int = 7
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()