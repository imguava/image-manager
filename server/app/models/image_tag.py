from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


# Association table for many-to-many relationship between images and tags
image_tag_relation = Table(
    "image_tag_relations",
    Base.metadata,
    Column("image_id", UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("image_tags.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, server_default=func.now())
)


class ImageTag(Base):
    __tablename__ = "image_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), default="#3B82F6")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    images = relationship("Image", secondary=image_tag_relation, back_populates="tags")