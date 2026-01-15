"""
Seed Demo User with Sample Data

This script seeds the demo@dollardata.app user with sample data.
It uses the existing Supabase Auth user ID.

Usage:
    python -m scripts.seed_demo
"""

import random
from datetime import datetime, timedelta, date
from decimal import Decimal
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

# Demo User - Must match Supabase Auth
DEMO_USER_ID = "2dfb59ef-c92a-422c-9bc8-9d7bde9551a6"  # From Supabase Auth
DEMO_EMAIL = "demo@dollardata.app"
DEMO_NAME = "Demo User"

# Household Members
MEMBERS = [
    {"name": "Alex", "color": "#3b82f6", "avatar": "User"},  # Blue
    {"name": "Sam", "color": "#ec4899", "avatar": "User"},   # Pink
]

# Accounts
ACCOUNTS = [
    {"name": "Everyday Account", "type": "Asset", "category": "Cash", "balance": 4250.50},
    {"name": "Savings Account", "type": "Asset", "category": "Savings", "balance": 35000.00},
    {"name": "Investment Portfolio", "type": "Asset", "category": "Investment", "balance": 0},
    {"name": "Super", "type": "Asset", "category": "Superannuation", "balance": 95000.00},
    {"name": "Home", "type": "Asset", "category": "Property", "balance": 850000.00},
    {"name": "Home Loan", "type": "Liability", "category": "Mortgage", "balance": 520000.00},
]

# Holdings
HOLDINGS = [
    {"ticker": "VAS.AX", "name": "Vanguard Australian Shares", "quantity": 250, "price": 96.50, "cost_basis": 88.20},
    {"ticker": "VGS.AX", "name": "Vanguard Intl Shares", "quantity": 180, "price": 112.40, "cost_basis": 98.50},
    {"ticker": "NDQ.AX", "name": "BetaShares NASDAQ 100", "quantity": 100, "price": 42.80, "cost_basis": 36.50},
]

# Budget Categories
CATEGORIES = [
    {"name": "Income", "group": "Income", "is_shared": True, "icon": "Wallet",
     "children": [
         {"name": "Salary", "icon": "Briefcase"},
         {"name": "Bonus", "icon": "Award"},
         {"name": "Interest", "icon": "TrendingUp"},
     ]},
    {"name": "Housing", "group": "Non-Discretionary", "is_shared": True, "icon": "Home",
     "children": [
         {"name": "Mortgage", "icon": "Home", "limit": 3200},
         {"name": "Utilities", "icon": "Zap", "limit": 400},
         {"name": "Insurance", "icon": "Shield", "limit": 150},
     ]},
    {"name": "Food & Drink", "group": "Non-Discretionary", "is_shared": True, "icon": "Utensils",
     "children": [
         {"name": "Groceries", "icon": "ShoppingCart", "limit": 800},
         {"name": "Dining Out", "group": "Discretionary", "icon": "UtensilsCrossed", "limit": 400},
         {"name": "Coffee", "group": "Discretionary", "icon": "Coffee", "limit": 150},
     ]},
    {"name": "Transport", "group": "Non-Discretionary", "is_shared": True, "icon": "Car",
     "children": [
         {"name": "Fuel", "icon": "Fuel", "limit": 250},
         {"name": "Public Transport", "icon": "Train", "limit": 200},
         {"name": "Car Insurance", "icon": "Shield", "limit": 110},
     ]},
    {"name": "Shopping", "group": "Discretionary", "is_shared": True, "icon": "ShoppingBag",
     "children": [
         {"name": "Clothing", "icon": "Shirt", "limit": 300},
         {"name": "Electronics", "icon": "Laptop", "limit": 100},
         {"name": "Household", "icon": "Sofa", "limit": 200},
     ]},
    {"name": "Health & Wellness", "group": "Non-Discretionary", "is_shared": True, "icon": "Heart",
     "children": [
         {"name": "Health Insurance", "icon": "Shield", "limit": 320},
         {"name": "Medical", "icon": "Stethoscope", "limit": 100},
         {"name": "Gym", "group": "Discretionary", "icon": "Dumbbell", "limit": 100},
     ]},
    {"name": "Lifestyle", "group": "Discretionary", "is_shared": True, "icon": "Smile",
     "children": [
         {"name": "Streaming", "icon": "Tv", "limit": 50},
         {"name": "Hobbies", "icon": "Palette", "limit": 150},
         {"name": "Travel", "icon": "Plane", "limit": 500},
     ]},
    {"name": "Transfers", "group": "Transfers", "is_shared": True, "is_transfer": True, "icon": "ArrowRightLeft",
     "children": [
         {"name": "Savings Transfer", "icon": "PiggyBank"},
         {"name": "Investments", "icon": "TrendingUp", "is_investment": True},
     ]}
]

# Goals
GOALS = [
    {"name": "Emergency Fund", "target": 20000, "date_offset": 90},
    {"name": "Europe Trip 2026", "target": 15000, "date_offset": 365},
    {"name": "New Car", "target": 50000, "date_offset": 730},
]

# Subscriptions
SUBSCRIPTIONS = [
    {"name": "Netflix", "amount": 22.99, "freq": "monthly", "cat": "Streaming"},
    {"name": "Spotify", "amount": 12.99, "freq": "monthly", "cat": "Streaming"},
    {"name": "Internet", "amount": 89.00, "freq": "monthly", "cat": "Utilities"},
    {"name": "Gym Membership", "amount": 54.90, "freq": "monthly", "cat": "Gym"},
    {"name": "Health Insurance", "amount": 320.00, "freq": "monthly", "cat": "Health Insurance"},
]

# Merchant Pools
MERCHANTS = {
    "Groceries": [("Woolworths", 60, 220), ("Coles", 50, 180), ("Aldi", 30, 90)],
    "Dining Out": [("Local Thai", 40, 90), ("Burger Bar", 30, 60), ("Pizza Place", 25, 50)],
    "Coffee": [("Corner Cafe", 4.5, 6.5), ("Starbucks", 5.5, 8.0)],
    "Fuel": [("BP", 60, 110), ("Shell", 55, 100)],
    "Public Transport": [("Opal Topup", 20, 50)],
    "Clothing": [("Uniqlo", 40, 120), ("Zara", 60, 180)],
    "Electronics": [("JB Hi-Fi", 50, 300), ("Officeworks", 20, 150)],
    "Household": [("Bunnings", 30, 200), ("Kmart", 15, 80)],
}


def clean_db(db: Session, user_id: str):
    """Clean up existing data for this user."""
    print(f"Cleaning existing data for user {user_id}...")
    
    # Delete in order of dependencies
    db.query(models.Transaction).filter(models.Transaction.user_id == user_id).delete()
    db.query(models.CategorizationRule).filter(models.CategorizationRule.user_id == user_id).delete()
    db.query(models.Subscription).filter(models.Subscription.user_id == user_id).delete()
    db.query(models.Goal).filter(models.Goal.user_id == user_id).delete()
    db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).delete()
    
    # Bucket Limits
    bucket_ids = [b.id for b in db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user_id).all()]
    if bucket_ids:
        db.query(models.BudgetLimit).filter(models.BudgetLimit.bucket_id.in_(bucket_ids)).delete(synchronize_session=False)
    
    db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user_id).delete()
    
    # Accounts & Holdings
    account_ids = [a.id for a in db.query(models.Account).filter(models.Account.user_id == user_id).all()]
    if account_ids:
        db.query(models.InvestmentHolding).filter(models.InvestmentHolding.account_id.in_(account_ids)).delete(synchronize_session=False)
    db.query(models.Account).filter(models.Account.user_id == user_id).delete()
    
    # Household Members
    db.query(models.HouseholdMember).filter(models.HouseholdMember.user_id == user_id).delete()
    
    db.commit()
    print("Cleanup complete.")


def get_random_time():
    """Return a random time between 8am and 9pm."""
    expiry = datetime.now().replace(hour=8, minute=0, second=0)
    minutes = random.randint(0, 13 * 60)
    return (expiry + timedelta(minutes=minutes)).time()


def json_date(date_obj):
    """Combine date with random time."""
    t = get_random_time()
    return datetime.combine(date_obj, t)


def create_txn(transactions, user_id, date_obj, cat_name, bucket_map, account_map, spender):
    """Helper to create a random transaction for a category."""
    pool = MERCHANTS.get(cat_name)
    if not pool:
        return

    merchant, min_amt, max_amt = random.choice(pool)
    amt = random.uniform(min_amt, max_amt)
    
    acc = account_map["Everyday Account"]
    bucket = bucket_map.get(cat_name)
    
    transactions.append(models.Transaction(
        user_id=user_id,
        date=json_date(date_obj),
        description=merchant,
        raw_description=merchant.upper() + " SYDNEY AU",
        amount=-round(amt, 2),
        bucket_id=bucket.id if bucket else None,
        spender=spender,
        is_verified=random.random() > 0.1,
        account_id=acc.id
    ))


def seed_data():
    print(f"Using Database: {engine.url}")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if user exists, create if not
        user = db.query(models.User).filter(models.User.id == DEMO_USER_ID).first()
        if not user:
            print("Creating User record...")
            user = models.User(
                id=DEMO_USER_ID,
                email=DEMO_EMAIL,
                name=DEMO_NAME,
                currency_symbol="$",
                created_at=datetime.now() - timedelta(days=450),
                mfa_enabled=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"User exists: {user.email}")
            clean_db(db, DEMO_USER_ID)
        
        # 2. Create Household Members
        print("Creating Members...")
        member_map = {}
        for m in MEMBERS:
            member = models.HouseholdMember(
                user_id=DEMO_USER_ID,
                name=m["name"],
                color=m["color"],
                avatar=m["avatar"]
            )
            db.add(member)
            db.flush()
            member_map[m["name"]] = member
        db.commit()
        
        # 3. Create Accounts & Holdings
        print("Creating Accounts...")
        account_map = {}
        for acc in ACCOUNTS:
            account = models.Account(
                user_id=DEMO_USER_ID,
                name=acc["name"],
                type=acc["type"],
                category=acc["category"],
                balance=acc["balance"]
            )
            db.add(account)
            db.flush()
            account_map[acc["name"]] = account
            
            if acc["name"] == "Investment Portfolio":
                total_value = 0
                for h in HOLDINGS:
                    val = h["quantity"] * h["price"]
                    total_value += val
                    holding = models.InvestmentHolding(
                        account_id=account.id,
                        ticker=h["ticker"],
                        name=h["name"],
                        quantity=h["quantity"],
                        price=h["price"],
                        cost_basis=h["cost_basis"],
                        value=val,
                        currency="AUD"
                    )
                    db.add(holding)
                account.balance = total_value
        
        db.commit()
        
        # 4. Create Categories
        print("Creating Categories...")
        bucket_map = {}
        display_order = 0
        
        for cat in CATEGORIES:
            parent = models.BudgetBucket(
                user_id=DEMO_USER_ID,
                name=cat["name"],
                icon_name=cat.get("icon", "Circle"),
                group=cat.get("group", "Discretionary"),
                is_shared=cat.get("is_shared", False),
                is_transfer=cat.get("is_transfer", False),
                is_investment=cat.get("is_investment", False),
                display_order=display_order
            )
            db.add(parent)
            db.flush()
            bucket_map[cat["name"]] = parent
            display_order += 1
            
            if "children" in cat:
                child_order = 0
                for child in cat["children"]:
                    child_bucket = models.BudgetBucket(
                        user_id=DEMO_USER_ID,
                        name=child["name"],
                        icon_name=child.get("icon", "Circle"),
                        group=child.get("group", cat.get("group")),
                        is_shared=child.get("is_shared", True),
                        parent_id=parent.id,
                        display_order=child_order
                    )
                    db.add(child_bucket)
                    db.flush()
                    bucket_map[child["name"]] = child_bucket
                    child_order += 1
                    
                    if "limit" in child and child["limit"] > 0:
                        db.add(models.BudgetLimit(bucket_id=child_bucket.id, member_id=None, amount=child["limit"]))

        db.commit()
        
        # 5. Create Goals
        print("Creating Goals...")
        for g in GOALS:
            goal = models.Goal(
                user_id=DEMO_USER_ID,
                name=g["name"],
                target_amount=g["target"],
                target_date=date.today() + timedelta(days=g["date_offset"]),
                linked_account_id=account_map["Savings Account"].id
            )
            db.add(goal)
        
        # 6. Create Subscriptions
        print("Creating Subscriptions...")
        for sub in SUBSCRIPTIONS:
            bucket = bucket_map.get(sub["cat"])
            s = models.Subscription(
                user_id=DEMO_USER_ID,
                name=sub["name"],
                amount=sub["amount"],
                frequency=sub["freq"],
                bucket_id=bucket.id if bucket else None,
                next_due_date=date.today() + timedelta(days=random.randint(1, 28)),
                is_active=True
            )
            db.add(s)
        
        db.commit()
        
        # 7. Generate Transactions
        print("Generating Transactions (12 months)...")
        transactions = []
        
        end_date = date.today()
        start_date = end_date - timedelta(days=12*30)
        current_date = start_date
        
        while current_date <= end_date:
            days_since_start = (current_date - start_date).days
            is_weekend = current_date.weekday() >= 5
            day_of_month = current_date.day
            
            # Income (Fortnightly)
            if days_since_start % 14 == 0:
                transactions.append(models.Transaction(
                    user_id=DEMO_USER_ID, date=json_date(current_date), 
                    description="Salary - Employer", raw_description="DIRECT CREDIT SALARY",
                    amount=3100.00, bucket_id=bucket_map["Salary"].id, 
                    spender="Alex", is_verified=True, account_id=account_map["Everyday Account"].id
                ))
            
            if (days_since_start + 7) % 14 == 0:
                transactions.append(models.Transaction(
                    user_id=DEMO_USER_ID, date=json_date(current_date), 
                    description="Salary - Company", raw_description="PAYROLL CREDIT",
                    amount=2800.00, bucket_id=bucket_map["Salary"].id, 
                    spender="Sam", is_verified=True, account_id=account_map["Everyday Account"].id
                ))
            
            # Mortgage (1st of month)
            if day_of_month == 1:
                transactions.append(models.Transaction(
                    user_id=DEMO_USER_ID, date=json_date(current_date), 
                    description="Mortgage Payment", raw_description="HOME LOAN REPAYMENT",
                    amount=-3200.00, bucket_id=bucket_map["Mortgage"].id, 
                    spender="Joint", is_verified=True, account_id=account_map["Everyday Account"].id
                ))
            
            # Daily spending
            if not is_weekend and random.random() < 0.7:
                create_txn(transactions, DEMO_USER_ID, current_date, "Coffee", bucket_map, account_map, random.choice(["Alex", "Sam"]))
            
            if not is_weekend and random.random() < 0.5:
                create_txn(transactions, DEMO_USER_ID, current_date, "Public Transport", bucket_map, account_map, random.choice(["Alex", "Sam"]))
            
            if random.random() < 0.35:
                create_txn(transactions, DEMO_USER_ID, current_date, "Groceries", bucket_map, account_map, "Joint")
            
            if is_weekend and random.random() < 0.4:
                create_txn(transactions, DEMO_USER_ID, current_date, "Dining Out", bucket_map, account_map, "Joint")
            
            if random.random() < 0.1:
                cat = random.choice(["Clothing", "Electronics", "Household", "Fuel"])
                create_txn(transactions, DEMO_USER_ID, current_date, cat, bucket_map, account_map, random.choice(["Alex", "Sam", "Joint"]))
            
            current_date += timedelta(days=1)
        
        print(f"Generated {len(transactions)} transactions.")
        
        # Add transactions in chunks
        chunk_size = 500
        for i in range(0, len(transactions), chunk_size):
            db.bulk_save_objects(transactions[i:i + chunk_size])
            db.commit()
            print(f"Saved chunk {i//chunk_size + 1}...")
        
        print("\n" + "="*60)
        print("SEEDING COMPLETE!")
        print("="*60)
        print(f"User: {DEMO_EMAIL}")
        print(f"ID: {DEMO_USER_ID}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
