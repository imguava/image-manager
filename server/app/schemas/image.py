from datetime import datetime
from typing import List, Optional
import uuid

from pydantic import BaseModel


class TagInfo(BaseModel):
    id: int
    name: str
    color: str
    is_system: bool


class ImageBase(BaseModel):
    original_name: str
    description: Optional[str] = None


class ImageCreate(ImageBase):
    pass


class ImageUpdate(BaseModel):
    original_name: Optional[str] = None
    description: Optional[str] = None


class ImageResponse(ImageBase):
    id: uuid.UUID
    filename: str
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    thumbnail_url: str
    original_url: str
    created_at: datetime
    updated_at: datetime
    tags: List[TagInfo] = []
    groups: List[str] = []
    ai_description: Optional[bool] = False
    ai_confidence: Optional[float] = None
    
    class Config:
        from_attributes = True