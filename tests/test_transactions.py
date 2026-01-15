"""
Principal Finance - Transaction Tests

Tests for:
- Transaction listing
- Transaction updates
- Batch operations (delete)
- Transaction splitting
"""
import pytest
from datetime import datetime, timedelta


class TestTransactionList:
    """Tests for transaction listing endpoint."""
    
    def test_list_transactions_empty(self, client, auth_headers):
        """List transactions returns empty for new user."""
        response = client.get("/api/transactions/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["items"] == []
        assert data["total"] == 0
    
    def test_list_transactions_with_data(self, client, auth_headers, sample_transactions):
        """List transactions returns user's transactions."""
        response = client.get("/api/transactions/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["total"] == 5
    
    def test_list_transactions_unauthorized(self, client):
        """List transactions requires authentication."""
        response = client.get("/api/transactions/")
        assert response.status_code == 401


@pytest.mark.skip(reason="Not implemented yet")
class TestTransactionUpdate:
    """Tests for transaction updates."""
    
    def test_update_transaction_category(self, client, auth_headers, sample_transactions, sample_bucket):
        """Update transaction's category."""
        # ... skipped ...
        pass

@pytest.mark.skip(reason="Not implemented yet")
class TestTransactionDelete:
    """Tests for transaction deletion."""
    pass

@pytest.mark.skip(reason="Not implemented yet")
class TestTransactionFiltering:
    """Tests for transaction filtering."""
    pass

@pytest.mark.skip(reason="Not implemented yet")
class TestTransactionSplit:
    """Tests for transaction splitting."""
    pass

@pytest.mark.skip(reason="Not implemented yet")
class TestPendingReview:
    """Tests for pending review endpoint."""
    pass
