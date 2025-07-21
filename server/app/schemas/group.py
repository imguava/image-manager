from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


class GroupResponse(GroupBase):
    id: int
    created_at: datetime
    level: int = 0
    path: List[int] = []
    full_path: str
    
    class Config:
        from_attributes = True