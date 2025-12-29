"""
API Documentation Examples
Reusable request/response examples for OpenAPI documentation
"""

# Authentication Examples
LOGIN_REQUEST_EXAMPLE = {
    "username": "user@example.com",
    "password": "SecurePassword123!"
}

LOGIN_RESPONSE_EXAMPLE = {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
}

REGISTER_REQUEST_EXAMPLE = {
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
}

USER_RESPONSE_EXAMPLE = {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "currency_symbol": "AUD",
    "is_email_verified": True,
    "mfa_enabled": False
}

# Transaction Examples
TRANSACTION_EXAMPLE = {
    "id": 1,
    "date": "2025-01-15",
    "description": "Grocery Shopping",
    "amount": -125.50,
    "category_id": 5,
    "category_name": "Groceries",
    "user_id": 1,
    "is_recurring": False,
    "notes": "Weekly shopping at Woolworths"
}

TRANSACTION_CREATE_EXAMPLE = {
    "date": "2025-01-15",
    "description": "Monthly Rent",
    "amount": -1500.00,
    "category_id": 2
}

TRANSACTION_LIST_RESPONSE_EXAMPLE = {
    "transactions": [TRANSACTION_EXAMPLE],
    "total": 1,
    "page": 1,
    "page_size": 50
}

# Budget Examples
BUDGET_BUCKET_EXAMPLE = {
    "id": 1,
    "name": "Groceries",
    "icon_name": "ShoppingCart",
    "group": "Non-Discretionary",
    "is_rollover": False,
    "monthly_budget": 800.00,
    "spent_this_month": 450.00
}

# Analytics Examples
DASHBOARD_RESPONSE_EXAMPLE = {
    "total_income": 5000.00,
    "total_expenses": 3200.00,
    "net_savings": 1800.00,
    "net_worth": 125000.00,
    "budget_progress": [
        {
            "category": "Groceries",
            "budget": 800,
            "spent": 450,
            "percentage": 56.25
        }
    ]
}

# Error Response Examples
ERROR_401_EXAMPLE = {
    "detail": "Could not validate credentials"
}

ERROR_404_EXAMPLE = {
    "detail": "Transaction not found"
}

ERROR_422_EXAMPLE = {
    "detail": [
        {
            "loc": ["body", "email"],
            "msg": "value is not a valid email address",
            "type": "value_error.email"
        }
    ]
}

ERROR_429_EXAMPLE = {
    "detail": "Rate limit exceeded. Please try again in 60 seconds."
}
