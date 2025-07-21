from sqlalchemy.orm import Session
import logging
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User
from app.models.image_tag import ImageTag

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """
    Initialize database with default data
    """
    db = SessionLocal()
    try:
        # Create default admin user if it doesn't exist
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            user = User(
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            logger.info("Created default admin user")
        
        # Create default tags if they don't exist
        default_tags = [
            {"name": "建筑", "color": "#EF4444", "is_system": True},
            {"name": "规划", "color": "#F59E0B", "is_system": True},
            {"name": "景观", "color": "#10B981", "is_system": True},
            {"name": "城市", "color": "#3B82F6", "is_system": True},
            {"name": "乡村", "color": "#8B5CF6", "is_system": True},
            {"name": "1K", "color": "#6B7280", "is_system": True},
            {"name": "2K", "color": "#6B7280", "is_system": True},
            {"name": "3K", "color": "#6B7280", "is_system": True},
            {"name": "4K", "color": "#6B7280", "is_system": True},
            {"name": "5K", "color": "#6B7280", "is_system": True},
            {"name": "6K", "color": "#6B7280", "is_system": True},
            {"name": "7K", "color": "#6B7280", "is_system": True},
            {"name": "8K", "color": "#6B7280", "is_system": True},
            {"name": "水平翻转", "color": "#9333EA", "is_system": True},
        ]
        
        for tag_data in default_tags:
            tag = db.query(ImageTag).filter(ImageTag.name == tag_data["name"]).first()
            if not tag:
                tag = ImageTag(**tag_data)
                db.add(tag)
        
        db.commit()
        logger.info("Created default tags")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()