from fastapi.testclient import TestClient


def test_login(client: TestClient):
    """
    Test login endpoint
    """
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "testuser"


def test_login_wrong_password(client: TestClient):
    """
    Test login with wrong password
    """
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "用户名或密码错误" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    """
    Test login with nonexistent user
    """
    response = client.post(
        "/api/auth/login",
        data={"username": "nonexistentuser", "password": "testpassword"}
    )
    assert response.status_code == 401
    assert "用户名或密码错误" in response.json()["detail"]


def test_me_endpoint(client: TestClient):
    """
    Test me endpoint
    """
    # First login to get token
    login_response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpassword"}
    )
    token = login_response.json()["access_token"]
    
    # Test me endpoint
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_me_endpoint_no_token(client: TestClient):
    """
    Test me endpoint without token
    """
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "访问令牌缺失" in response.json()["detail"]