import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import Base, get_db
from app.main import app
from app.models.user import User
from app.models.image_tag import ImageTag


# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db():
    # Create the database and tables
    Base.metadata.create_all(bind=engine)
    
    # Create test data
    db = TestingSessionLocal()
    
    # Create test user
    hashed_password = get_password_hash("testpassword")
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=hashed_password,
        role="admin",
        is_active=True
    )
    db.add(user)
    
    # Create test tags
    tags = [
        ImageTag(name="Test Tag 1", color="#FF0000"),
        ImageTag(name="Test Tag 2", color="#00FF00"),
        ImageTag(name="Test Tag 3", color="#0000FF")
    ]
    for tag in tags:
        db.add(tag)
    
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides = {}