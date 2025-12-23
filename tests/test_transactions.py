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
        response = client.get("/transactions/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["items"] == []
        assert data["total"] == 0
    
    def test_list_transactions_with_data(self, client, auth_headers, sample_transactions):
        """List transactions returns user's transactions."""
        response = client.get("/transactions/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["total"] == 5
    
    def test_list_transactions_unauthorized(self, client):
        """List transactions requires authentication."""
        response = client.get("/transactions/")
        assert response.status_code == 401


class TestTransactionUpdate:
    """Tests for transaction updates."""
    
    def test_update_transaction_category(self, client, auth_headers, sample_transactions, sample_bucket):
        """Update transaction's category."""
        txn = sample_transactions[0]
        response = client.put(f"/transactions/{txn.id}",
            headers=auth_headers,
            json={"bucket_id": sample_bucket.id}
        )
        assert response.status_code == 200
        assert response.json()["bucket_id"] == sample_bucket.id
    
    def test_update_transaction_description(self, client, auth_headers, sample_transactions):
        """Update transaction description."""
        txn = sample_transactions[0]
        response = client.put(f"/transactions/{txn.id}",
            headers=auth_headers,
            json={"description": "Updated Description"}
        )
        assert response.status_code == 200
        assert response.json()["description"] == "Updated Description"
    
    def test_update_nonexistent_transaction(self, client, auth_headers):
        """Update fails for non-existent transaction."""
        response = client.put("/transactions/99999",
            headers=auth_headers,
            json={"description": "Should Fail"}
        )
        assert response.status_code == 404


class TestTransactionDelete:
    """Tests for transaction deletion."""
    
    def test_delete_single_transaction(self, client, auth_headers, sample_transactions):
        """Delete a single transaction."""
        txn = sample_transactions[0]
        response = client.delete(f"/transactions/{txn.id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get("/transactions/", headers=auth_headers)
        ids = [t["id"] for t in get_response.json()["items"]]
        assert txn.id not in ids
    
    def test_batch_delete_transactions(self, client, auth_headers, sample_transactions):
        """Delete multiple transactions at once."""
        ids_to_delete = [sample_transactions[0].id, sample_transactions[1].id]
        response = client.post(
            "/transactions/batch-delete",
            headers=auth_headers,
            json=ids_to_delete  # Body is a simple list
        )
        assert response.status_code == 200
        
        # Verify they're deleted
        get_response = client.get("/transactions/", headers=auth_headers)
        remaining_ids = [t["id"] for t in get_response.json()["items"]]
        for deleted_id in ids_to_delete:
            assert deleted_id not in remaining_ids


class TestTransactionFiltering:
    """Tests for transaction filtering."""
    
    def test_filter_by_bucket(self, client, auth_headers, sample_transactions, sample_bucket):
        """Filter transactions by category bucket."""
        response = client.get(
            f"/transactions/?bucket_id={sample_bucket.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        for txn in data["items"]:
            assert txn["bucket_id"] == sample_bucket.id
    
    def test_filter_by_search(self, client, auth_headers, sample_transactions):
        """Filter transactions by search text."""
        response = client.get(
            "/transactions/?search=Transaction%201",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1


class TestTransactionSplit:
    """Tests for transaction splitting."""
    
    def test_split_transaction(self, client, auth_headers, sample_transactions, test_db, test_user, sample_bucket):
        """Split a transaction into multiple parts."""
        from backend import models
        
        # Create a second bucket for split
        bucket2 = models.BudgetBucket(
            name="Entertainment",
            user_id=test_user.id,
            group="Discretionary"
        )
        test_db.add(bucket2)
        test_db.commit()
        test_db.refresh(bucket2)
        
        txn = sample_transactions[0]
        original_amount = txn.amount
        
        response = client.post(
            f"/transactions/{txn.id}/split",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "date": txn.date.isoformat(),
                        "description": "Split Part 1",
                        "amount": original_amount / 2,
                        "bucket_id": sample_bucket.id
                    },
                    {
                        "date": txn.date.isoformat(),
                        "description": "Split Part 2", 
                        "amount": original_amount / 2,
                        "bucket_id": bucket2.id
                    }
                ]
            }
        )
        assert response.status_code == 200


class TestPendingReview:
    """Tests for pending review endpoint."""
    
    def test_get_pending_review_empty(self, client, auth_headers):
        """No transactions pending review for new user."""
        response = client.get("/transactions/pending-review", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
