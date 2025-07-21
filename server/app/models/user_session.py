from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")