from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


# Association table for many-to-many relationship between images and groups
image_group_relation = Table(
    "image_group_relations",
    Base.metadata,
    Column("image_id", UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("image_groups.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, server_default=func.now())
)


class ImageGroup(Base):
    __tablename__ = "image_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("image_groups.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    images = relationship("Image", secondary=image_group_relation, back_populates="groups")
    children = relationship("ImageGroup", 
                           backref=relationship.backref("parent", remote_side=[id]),
                           cascade="all, delete-orphan")