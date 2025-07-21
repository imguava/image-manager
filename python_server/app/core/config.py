import os
import secrets
from typing import List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 3001
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS settings
    CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost", "http://localhost:3000"]
    
    # Database settings
    POSTGRES_SERVER: str = os.getenv("DB_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("DB_PORT", "5432")
    POSTGRES_USER: str = os.getenv("DB_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    POSTGRES_DB: str = os.getenv("DB_NAME", "image_manager")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # MinIO settings
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost")
    MINIO_PORT: int = int(os.getenv("MINIO_PORT", "9000"))
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
    MINIO_USE_SSL: bool = os.getenv("MINIO_USE_SSL", "False").lower() == "true"
    MINIO_BUCKET_NAME: str = "images"
    
    # AI Model settings
    USE_AI_DESCRIPTION: bool = os.getenv("USE_AI_DESCRIPTION", "False").lower() == "true"
    AI_MODEL_PATH: Optional[str] = os.getenv("AI_MODEL_PATH")
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()