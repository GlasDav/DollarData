"""
Principal Finance - Test Fixtures

Provides shared fixtures for all tests including:
- Test database with isolated transactions
- FastAPI TestClient with rate limiting disabled
- Authentication helpers
"""
import os
import sys
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, get_db
from backend import models, auth


# ============================================
# DATABASE FIXTURES
# ============================================

@pytest.fixture(scope="function")
def test_engine():
    """Create an in-memory SQLite engine for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_db(test_engine):
    """Create a database session for testing."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(test_db):
    """Create a FastAPI TestClient with test database and disabled rate limiting."""
    # Import app after patching to get the patched version
    from backend.main import app, limiter as main_limiter
    from backend.routers.auth import limiter as auth_limiter
    
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Disable rate limiting for tests (both limiters)
    main_limiter.enabled = False
    auth_limiter.enabled = False
    
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    
    # Re-enable and clean up
    main_limiter.enabled = True
    auth_limiter.enabled = True
    app.dependency_overrides.clear()


# ============================================
# USER & AUTH FIXTURES
# ============================================

@pytest.fixture
def test_user_data():
    """Standard test user credentials."""
    return {
        "email": "test@example.com",
        "password": "SecurePassword123!"
    }


@pytest.fixture
def test_user(test_db, test_user_data):
    """Create a test user in the database (without triggering default setup)."""
    # hashed_password removed - Supabase handles auth
    user = models.User(
        id="test-user-id-123", # Explicit ID for testing
        email=test_user_data["email"],
        name="Test User",
        is_email_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture  
def auth_token(test_user, test_user_data):
    """Generate a valid JWT token for the test user."""
    from jose import jwt
    import os
    from datetime import datetime, timedelta
    
    # Use the same secret as the test environment
    secret_key = os.getenv("SECRET_KEY", "test-secret-key")
    algorithm = "HS256"
    
    payload = {
        "sub": test_user.id, 
        "email": test_user_data["email"],
        "exp": datetime.utcnow() + timedelta(minutes=30),
        "aud": "authenticated", # Supabase audience
        "role": "authenticated"
    }
    
    return jwt.encode(payload, secret_key, algorithm=algorithm)


@pytest.fixture
def auth_headers(auth_token):
    """Get authentication headers for API requests."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def unverified_user(test_db):
    """Create a user without email verification."""
    user = models.User(
        id="unverified-user-id-456",
        email="unverified@example.com",
        name="Unverified User",
        is_email_verified=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


# ============================================
# DATA FIXTURES
# ============================================

@pytest.fixture
def sample_bucket(test_db, test_user):
    """Create a sample budget bucket."""
    bucket = models.BudgetBucket(
        name="Groceries",
        user_id=test_user.id,
        group="Discretionary"
    )
    test_db.add(bucket)
    test_db.commit()
    test_db.refresh(bucket)
    return bucket


@pytest.fixture
def sample_transactions(test_db, test_user, sample_bucket):
    """Create sample transactions for testing."""
    transactions = []
    for i in range(5):
        txn = models.Transaction(
            user_id=test_user.id,
            bucket_id=sample_bucket.id,
            date=datetime.now() - timedelta(days=i),
            description=f"Test Transaction {i+1}",
            raw_description=f"TEST TXN {i+1}",
            amount=-50.0 * (i + 1),
            spender="Joint",
            is_verified=True
        )
        transactions.append(txn)
        test_db.add(txn)
    
    test_db.commit()
    for txn in transactions:
        test_db.refresh(txn)
    return transactions


@pytest.fixture
def sample_account(test_db, test_user):
    """Create a sample bank account."""
    account = models.Account(
        user_id=test_user.id,
        name="Savings Account",
        type="Asset",
        category="Cash",
        is_active=True
    )
    test_db.add(account)
    test_db.commit()
    test_db.refresh(account)
    return account


# ============================================
# DATE HELPERS
# ============================================

@pytest.fixture
def date_range():
    """Standard date range for analytics queries."""
    end = datetime.now()
    start = end - timedelta(days=30)
    return {
        "start_date": start.strftime("%Y-%m-%d"),
        "end_date": end.strftime("%Y-%m-%d")
    }
