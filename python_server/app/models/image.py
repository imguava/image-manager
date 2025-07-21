import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_size = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    format = Column(String(50), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    original_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # AI-generated description flag
    ai_description = Column(Boolean, default=False)
    
    # AI confidence score (0-1)
    ai_confidence = Column(Float, nullable=True)
    
    # Relationships
    tags = relationship("ImageTag", secondary="image_tag_relations", back_populates="images")
    groups = relationship("ImageGroup", secondary="image_group_relations", back_populates="images")