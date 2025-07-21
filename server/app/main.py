from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from typing import List

from app.api.routes import auth, images, groups, tags
from app.core.config import settings
from app.core.security import get_current_user
from app.db.init_db import init_db
from app.db.session import engine, Base
from app.models.user import User

# Create FastAPI app
app = FastAPI(
    title="Image Manager API",
    description="API for managing images with AI-powered descriptions",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(images.router, prefix="/api/images", tags=["Images"])
app.include_router(groups.router, prefix="/api/groups", tags=["Groups"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "OK", "message": "图片管理系统运行正常"}

# Create static files directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/originals", exist_ok=True)
os.makedirs("uploads/thumbnails", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def startup_event():
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize database with default data
    await init_db()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.DEBUG
    )