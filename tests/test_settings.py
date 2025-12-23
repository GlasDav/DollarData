"""
Principal Finance - Settings Tests

Tests for:
- User settings CRUD
- Budget buckets management
- Categorization rules
"""
import pytest


class TestUserSettings:
    """Tests for user settings endpoint."""
    
    def test_get_user_settings(self, client, auth_headers):
        """Get current user settings."""
        response = client.get("/settings/user", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "is_couple_mode" in data
        assert "currency_symbol" in data
    
    def test_update_user_settings(self, client, auth_headers):
        """Update user settings."""
        response = client.put("/settings/user",
            headers=auth_headers,
            json={
                "is_couple_mode": True,
                "name_a": "Alice",
                "name_b": "Bob"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_couple_mode"] == True
        assert data["name_a"] == "Alice"
        assert data["name_b"] == "Bob"


class TestBudgetBuckets:
    """Tests for budget bucket management."""
    
    def test_list_buckets(self, client, auth_headers):
        """List all budget buckets."""
        response = client.get("/settings/buckets", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_bucket(self, client, auth_headers):
        """Create a new budget bucket."""
        response = client.post("/settings/buckets",
            headers=auth_headers,
            json={
                "name": "New Category",
                "icon_name": "Wallet",
                "group": "Discretionary",
                "monthly_limit_a": 300.0,
                "monthly_limit_b": 0.0,
                "is_shared": False,
                "is_rollover": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Category"
        assert data["monthly_limit_a"] == 300.0
        assert data["is_rollover"] == True
    
    def test_update_bucket(self, client, auth_headers, sample_bucket):
        """Update an existing bucket."""
        response = client.put(f"/settings/buckets/{sample_bucket.id}",
            headers=auth_headers,
            json={
                "name": "Updated Groceries",
                "icon_name": "ShoppingCart",
                "group": "Discretionary",
                "monthly_limit_a": 600.0,
                "monthly_limit_b": 0.0,
                "is_shared": False,
                "is_rollover": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Groceries"
        assert data["monthly_limit_a"] == 600.0
    
    def test_delete_bucket(self, client, auth_headers, sample_bucket):
        """Delete a budget bucket."""
        response = client.delete(
            f"/settings/buckets/{sample_bucket.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
    
    def test_delete_protected_bucket_fails(self, client, auth_headers, test_db, test_user):
        """Cannot delete a protected bucket (transfers/investments)."""
        from backend import models
        
        # Create a protected transfer bucket
        transfer_bucket = models.BudgetBucket(
            name="Transfers",
            user_id=test_user.id,
            group="Non-Discretionary",
            is_transfer=True
        )
        test_db.add(transfer_bucket)
        test_db.commit()
        test_db.refresh(transfer_bucket)
        
        response = client.delete(
            f"/settings/buckets/{transfer_bucket.id}",
            headers=auth_headers
        )
        # Should fail because transfers bucket is protected
        assert response.status_code == 400


class TestCategorizationRules:
    """Tests for categorization rules."""
    
    def test_list_rules(self, client, auth_headers):
        """List all categorization rules."""
        response = client.get("/settings/rules", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_rule(self, client, auth_headers, sample_bucket):
        """Create a new categorization rule."""
        response = client.post("/settings/rules",
            headers=auth_headers,
            json={
                "keywords": "WOOLWORTHS,COLES",
                "bucket_id": sample_bucket.id,
                "priority": 10
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Keywords may be reordered/normalized by the API
        assert "WOOLWORTHS" in data["keywords"]
        assert "COLES" in data["keywords"]
        assert data["bucket_id"] == sample_bucket.id
    
    def test_update_rule(self, client, auth_headers, test_db, test_user, sample_bucket):
        """Update an existing rule."""
        from backend import models
        
        rule = models.CategorizationRule(
            user_id=test_user.id,
            bucket_id=sample_bucket.id,
            keywords="TEST",
            priority=5
        )
        test_db.add(rule)
        test_db.commit()
        test_db.refresh(rule)
        
        response = client.put(f"/settings/rules/{rule.id}",
            headers=auth_headers,
            json={
                "keywords": "UPDATED,KEYWORDS", 
                "bucket_id": sample_bucket.id,
                "priority": 20
            }
        )
        assert response.status_code == 200
        assert response.json()["priority"] == 20
    
    def test_delete_rule(self, client, auth_headers, test_db, test_user, sample_bucket):
        """Delete a categorization rule."""
        from backend import models
        
        rule = models.CategorizationRule(
            user_id=test_user.id,
            bucket_id=sample_bucket.id,
            keywords="DELETE_ME",
            priority=0
        )
        test_db.add(rule)
        test_db.commit()
        test_db.refresh(rule)
        
        response = client.delete(f"/settings/rules/{rule.id}", headers=auth_headers)
        assert response.status_code == 200
