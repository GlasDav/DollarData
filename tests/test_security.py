"""
Principal Finance - Security Tests

Tests for:
- Input sanitization and XSS protection
- Security utilities
"""
import pytest
from backend.security import (
    sanitize_string, 
    sanitize_text_field, 
    validate_safe_string,
    sanitize_filename,
    is_safe_redirect_url
)


class TestInputSanitization:
    """Tests for input sanitization functions."""
    
    def test_sanitize_basic_script_tag(self):
        """Script tags are escaped."""
        dangerous = "<script>alert('xss')</script>"
        result = sanitize_string(dangerous)
        assert "<script>" not in result
        assert "&lt;script&gt;" in result
    
    def test_sanitize_javascript_protocol(self):
        """JavaScript protocol is handled."""
        result = sanitize_text_field("javascript:alert('xss')")
        # Should escape or remove
        assert "javascript:" not in result or "&" in result
    
    def test_sanitize_event_handlers(self):
        """Event handlers are handled."""
        dangerous = '<img onerror="alert(1)">'
        result = sanitize_text_field(dangerous)
        # Should be escaped
        assert result != dangerous
    
    def test_sanitize_normal_input(self):
        """Normal input is preserved (with escaped chars)."""
        normal = "Grocery shopping at WOOLWORTHS"
        result = sanitize_string(normal)
        assert "Grocery shopping at WOOLWORTHS" == result
    
    def test_sanitize_trims_whitespace(self):
        """Whitespace is trimmed."""
        result = sanitize_string("   trimmed   ")
        assert result == "trimmed"
    
    def test_sanitize_max_length(self):
        """Max length is enforced."""
        long_string = "a" * 2000
        result = sanitize_string(long_string, max_length=100)
        assert len(result) == 100
    
    def test_sanitize_none_input(self):
        """None input returns None."""
        assert sanitize_string(None) is None


class TestValidateSafeString:
    """Tests for safe string validation."""
    
    def test_safe_string(self):
        """Normal strings are safe."""
        assert validate_safe_string("Hello World") == True
    
    def test_unsafe_script(self):
        """Script tags are unsafe."""
        assert validate_safe_string("<script>") == False
    
    def test_unsafe_event_handler(self):
        """Event handlers are unsafe."""
        assert validate_safe_string('onclick="alert(1)"') == False


class TestFilenameSanitization:
    """Tests for filename sanitization."""
    
    def test_remove_path_traversal(self):
        """Path traversal is prevented."""
        result = sanitize_filename("../../../etc/passwd")
        assert ".." not in result
        assert "/" not in result
    
    def test_remove_leading_dots(self):
        """Leading dots are removed."""
        result = sanitize_filename("...hidden")
        assert not result.startswith(".")
    
    def test_preserve_extension(self):
        """File extension is preserved."""
        result = sanitize_filename("document.pdf")
        assert result == "document.pdf"


class TestRedirectValidation:
    """Tests for safe redirect URL validation."""
    
    def test_relative_url_safe(self):
        """Relative URLs are safe."""
        assert is_safe_redirect_url("/dashboard") == True
    
    def test_protocol_relative_unsafe(self):
        """Protocol-relative URLs are not safe."""
        assert is_safe_redirect_url("//evil.com") == False
    
    def test_external_url_unsafe(self):
        """External URLs are not safe by default."""
        assert is_safe_redirect_url("https://evil.com") == False
    
    def test_allowed_host(self):
        """Allowed hosts are safe."""
        result = is_safe_redirect_url(
            "https://principal.app/callback",
            allowed_hosts=["principal.app"]
        )
        assert result == True


class TestSchemaXSSProtection:
    """Integration tests for XSS protection in API schemas."""
    
    def test_transaction_description_sanitized(self, client, auth_headers, sample_transactions):
        """Transaction update sanitizes description."""
        txn = sample_transactions[0]
        response = client.put(f"/transactions/{txn.id}",
            headers=auth_headers,
            json={"description": "<script>alert('xss')</script>Normal Text"}
        )
        assert response.status_code == 200
        # Script tags should be escaped
        assert "<script>" not in response.json()["description"]
    
    def test_bucket_name_sanitized(self, client, auth_headers):
        """Bucket creation sanitizes name."""
        response = client.post("/settings/buckets",
            headers=auth_headers,
            json={
                "name": "<img onerror=alert(1)>Shopping",
                "icon_name": "Cart",
                "group": "Discretionary",
                "monthly_limit_a": 100.0,
                "monthly_limit_b": 0.0,
                "is_shared": False,
                "is_rollover": False
            }
        )
        assert response.status_code == 200
        # HTML should be escaped
        assert "<img" not in response.json()["name"]
