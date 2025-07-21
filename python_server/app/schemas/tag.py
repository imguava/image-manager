from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagResponse(TagBase):
    id: int
    is_system: bool
    created_at: datetime
    
    class Config:
        from_attributes = True