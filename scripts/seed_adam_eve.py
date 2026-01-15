"""
Seed 'Adam & Eve' Demo User with Narrative-Driven Data

Personas:
- Adam (30): $95k Gross (~$2770 net/fortnight)
- Eve (30): $125k Gross (~$3460 net/fortnight)
- Dataset: 14 months (Jan 1st last year to Today)
- Volume: ~2000+ transactions (High frequency daily grind)

Narratives:
- The Vacation (July): 10-day trip (Flights, Hotels, Dining)
- The Emergency (October): Mechanic bill ($600)
- The Bonus (December): Eve gets a bonus + Splurge

Usage:
    python -m scripts.seed_adam_eve
"""

import random
from datetime import datetime, timedelta, date
from decimal import Decimal
import sys
import os
import math

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models
import uuid

# Credentials
DEMO_EMAIL = "adam.eve@dollardata.au"
DEMO_PASSWORD = "demo123"
DEMO_NAME = "Adam" # Primary user name

# Households
MEMBERS = [
    {"name": "Adam", "color": "#3b82f6", "avatar": "User"},  # Blue
    {"name": "Eve", "color": "#ec4899", "avatar": "User"},   # Pink
]

# Assets & Liabilities
ACCOUNTS = [
    # Joint
    {"name": "Joint Everyday", "type": "Asset", "category": "Cash", "balance": 4250.50},
    {"name": "Offset Account", "type": "Asset", "category": "Savings", "balance": 35000.00}, # Linked to Mortgage
    # Personal
    {"name": "Adam Personal", "type": "Asset", "category": "Cash", "balance": 1200.00},
    {"name": "Eve Personal", "type": "Asset", "category": "Cash", "balance": 2800.00},
    # Investments
    {"name": "Joint Portfolio", "type": "Asset", "category": "Investment", "balance": 0}, # Calculated from holdings
    # Super
    {"name": "Adam Super", "type": "Asset", "category": "Superannuation", "balance": 85000.00},
    {"name": "Eve Super", "type": "Asset", "category": "Superannuation", "balance": 115000.00},
    # Property
    {"name": "Primary Residence", "type": "Asset", "category": "Property", "balance": 850000.00},
    # Liability
    {"name": "Home Loan", "type": "Liability", "category": "Mortgage", "balance": 520000.00},
]

# Holdings (for Joint Portfolio)
HOLDINGS = [
    {"ticker": "VAS.AX", "name": "Vanguard Australian Shares", "quantity": 250, "price": 96.50, "cost_basis": 88.20},
    {"ticker": "VGS.AX", "name": "Vanguard Intl Shares", "quantity": 180, "price": 112.40, "cost_basis": 98.50},
    {"ticker": "NDQ.AX", "name": "BetaShares NASDAQ 100", "quantity": 100, "price": 42.80, "cost_basis": 36.50},
    {"ticker": "CBA.AX", "name": "Commonwealth Bank", "quantity": 45, "price": 118.50, "cost_basis": 105.00},
]

# Budget Categories (Hierarchical)
# Format: Name, Icon, Group, IsShared, [Children], Limit (Shared or Split dict)
CATEGORIES = [
    # INCOME
    {
        "name": "Income", "group": "Income", "is_shared": True, "icon": "Wallet",
        "children": [
            {"name": "Salary", "icon": "Briefcase"},
            {"name": "Bonus", "icon": "Award"}, # For December arc
            {"name": "Interest", "icon": "TrendingUp"},
            {"name": "Dividends", "icon": "PieChart"},
        ]
    },
    # HOUSING (Fixed)
    {
        "name": "Housing", "group": "Non-Discretionary", "is_shared": True, "icon": "Home",
        "children": [
            {"name": "Mortgage Repayment", "icon": "Home", "limit": 3200}, # Monthly
            {"name": "Council Rates", "icon": "Building", "limit": 400}, # Quarterly
            {"name": "Home Insurance", "icon": "Shield", "limit": 150},
            {"name": "Maintenance", "icon": "Wrench", "limit": 200},
        ]
    },
    # UTILITIES (Shared)
    {
        "name": "Utilities", "group": "Non-Discretionary", "is_shared": True, "icon": "Zap",
        "children": [
            {"name": "Electricity", "icon": "Zap", "limit": 180},
            {"name": "Gas", "icon": "Flame", "limit": 80},
            {"name": "Water", "icon": "Droplet", "limit": 60},
            {"name": "Internet", "icon": "Wifi", "limit": 89},
            {"name": "Mobile Phone", "icon": "Smartphone", "limit": 130}, # 2x plans
        ]
    },
    # FOOD (Mix)
    {
        "name": "Food & Drink", "group": "Non-Discretionary", "is_shared": True, "icon": "Utensils",
        "children": [
            {"name": "Groceries", "group": "Non-Discretionary", "icon": "ShoppingCart", "limit": 800}, # Approx $200/wk
            {"name": "Dining Out", "group": "Discretionary", "icon": "UtensilsCrossed", "limit": {"Adam": 250, "Eve": 250}, "is_shared": False}, # Split
            {"name": "Coffee", "group": "Discretionary", "icon": "Coffee", "limit": {"Adam": 100, "Eve": 100}, "is_shared": False},
            {"name": "Alcohol", "group": "Discretionary", "icon": "Wine", "limit": 150},
        ]
    },
    # TRANSPORT
    {
        "name": "Transport", "group": "Non-Discretionary", "is_shared": True, "icon": "Car",
        "children": [
            {"name": "Fuel", "icon": "Fuel", "limit": 250},
            {"name": "Public Transport", "icon": "Train", "limit": {"Adam": 120, "Eve": 120}}, # Commute
            {"name": "Car Insurance", "icon": "Shield", "limit": 110},
            {"name": "Uber/Taxi", "group": "Discretionary", "icon": "Car", "limit": 100},
        ]
    },
    # SHOPPING (Split)
    {
        "name": "Shopping", "group": "Discretionary", "is_shared": False, "icon": "ShoppingBag",
        "children": [
            {"name": "Clothing", "icon": "Shirt", "limit": {"Adam": 150, "Eve": 250}},
            {"name": "Electronics", "icon": "Laptop", "limit": 100},
            {"name": "Household", "icon": "Sofa", "limit": 200},
            {"name": "Gifts", "icon": "Gift", "limit": 100},
        ]
    },
    # HEALTH
    {
        "name": "Health", "group": "Non-Discretionary", "is_shared": True, "icon": "Heart",
        "children": [
            {"name": "Health Insurance", "icon": "Shield", "limit": 320},
            {"name": "Medical", "icon": "Stethoscope", "limit": 100},
            {"name": "Pharmacy", "icon": "Pill", "limit": 50},
            {"name": "Gym", "group": "Discretionary", "icon": "Dumbbell", "limit": {"Adam": 60, "Eve": 80}},
        ]
    },
    # LIFESTYLE
    {
        "name": "Lifestyle", "group": "Discretionary", "is_shared": True, "icon": "Smile",
        "children": [
            {"name": "Streaming", "icon": "Tv", "limit": 50},
            {"name": "Hobbies", "icon": "Palette", "limit": 150},
            {"name": "Travel", "icon": "Plane", "limit": 0}, # Sinking fund usually
            {"name": "Personal Care", "icon": "Sparkles", "limit": {"Adam": 40, "Eve": 150}},
        ]
    },
    # TRANSFERS
    {
        "name": "Transfers", "group": "Transfers", "is_shared": True, "is_transfer": True, "icon": "ArrowRightLeft",
        "children": [
            {"name": "Savings Transfer", "icon": "PiggyBank"},
            {"name": "Credit Card Payment", "icon": "CreditCard"},
            {"name": "Investments", "icon": "TrendingUp", "is_investment": True},
        ]
    }
]

# Goals
GOALS = [
    {"name": "Europe Summer 2026", "target": 15000, "current": 8500, "date_offset": 365},
    {"name": "Emergency Fund", "target": 20000, "current": 18000, "date_offset": 60},
    {"name": "Kitchen Reno", "target": 40000, "current": 4500, "date_offset": 500},
    {"name": "New Car", "target": 55000, "current": 2000, "date_offset": 730},
]

# Subscriptions
SUBSCRIPTIONS = [
    {"name": "Netflix", "amount": 22.99, "freq": "monthly", "cat": "Streaming", "payer": "Joint"},
    {"name": "Spotify Duo", "amount": 19.99, "freq": "monthly", "cat": "Streaming", "payer": "Eve"},
    {"name": "Internet (NBN)", "amount": 89.00, "freq": "monthly", "cat": "Internet", "payer": "Joint"},
    {"name": "Anytime Fitness", "amount": 54.90, "freq": "monthly", "cat": "Gym", "payer": "Adam"},
    {"name": "Pilates Studio", "amount": 75.00, "freq": "fortnightly", "cat": "Gym", "payer": "Eve"},
    {"name": "Adobe Creative Cloud", "amount": 45.00, "freq": "monthly", "cat": "Hobbies", "payer": "Adam"},
    {"name": "Health Insurance", "amount": 320.00, "freq": "monthly", "cat": "Health Insurance", "payer": "Joint"},
]

# Merchant Pools
MERCHANTS = {
    # Food
    "Groceries": [("Woolworths", 60, 220), ("Coles", 50, 180), ("Harris Farm", 40, 120), ("Aldi", 30, 90), ("Baker's Delight", 8, 25)],
    "Dining Out": [("Local Thai", 40, 90), ("Burger Project", 30, 60), ("Sushi Train", 25, 50), ("Pub Dinner", 50, 110), ("Fancy Italian", 120, 200)],
    "Coffee": [("Corner Cafe", 4.5, 6.5), ("Starbucks", 5.5, 8.0), ("The Roastery", 5.0, 7.0)],
    "Alcohol": [("Dan Murphy's", 40, 120), ("BWS", 25, 60), ("Vintage Cellars", 50, 150)],
    # Transport
    "Fuel": [("BP", 60, 110), ("Ampol", 55, 100), ("Shell", 40, 90)],
    "Public Transport": [("Opal Topup", 20, 50)],
    "Uber/Taxi": [("Uber Trip", 15, 45), ("DiDi Trip", 12, 35)],
    # Shopping
    "Clothing": [("Uniqlo", 40, 120), ("Zara", 60, 180), ("The Iconic", 50, 150), ("Myer", 80, 250), ("Cotton On", 30, 80)],
    "Electronics": [("JB Hi-Fi", 50, 500), ("Officeworks", 20, 150), ("Apple", 20, 200)],
    "Household": [("Bunnings", 30, 200), ("Kmart", 15, 80), ("IKEA", 50, 300), ("Woolworths", 10, 40)], # Household items
    "Personal Care": [("Chemist Warehouse", 20, 80), ("Priceline", 15, 60), ("Mecca", 40, 150), ("Barber", 35, 50)],
    # Health
    "Pharmacy": [("Chemist Warehouse", 10, 40), ("Local Pharmacy", 15, 55)],
    "Medical": [("GP Consult", 80, 120), ("Dentist", 200, 400), ("Physio", 90, 130)],
}

# ---------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------

def clean_db(db: Session, email: str):
    """Clean up existing data for this user."""
    print(f"Cleaning existing data for {email}...")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return

    # Delete in order of dependencies
    db.query(models.Transaction).filter(models.Transaction.user_id == user.id).delete()
    db.query(models.CategorizationRule).filter(models.CategorizationRule.user_id == user.id).delete()
    db.query(models.Subscription).filter(models.Subscription.user_id == user.id).delete()
    db.query(models.Goal).filter(models.Goal.user_id == user.id).delete()
    db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user.id).delete()
    
    # Bucket Limits
    bucket_ids = [b.id for b in db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user.id).all()]
    if bucket_ids:
        db.query(models.BudgetLimit).filter(models.BudgetLimit.bucket_id.in_(bucket_ids)).delete(synchronize_session=False)
    
    db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user.id).delete()
    
    # Accounts & Holdings
    account_ids = [a.id for a in db.query(models.Account).filter(models.Account.user_id == user.id).all()]
    if account_ids:
        db.query(models.InvestmentHolding).filter(models.InvestmentHolding.account_id.in_(account_ids)).delete(synchronize_session=False)
    db.query(models.Account).filter(models.Account.user_id == user.id).delete()
    
    # Household
    db.query(models.HouseholdMember).filter(models.HouseholdMember.user_id == user.id).delete()
    # Note: Not deleting household object itself to keep it simple, just members/data
    
    db.delete(user)
    db.commit()
    print("Cleanup complete.")

def get_random_time():
    """Return a random time between 8am and 9pm."""
    expiry = datetime.now().replace(hour=8, minute=0, second=0)
    minutes = random.randint(0, 13 * 60)
    return (expiry + timedelta(minutes=minutes)).time()

# ---------------------------------------------------------
# Seeding Logic
# ---------------------------------------------------------

def seed_data():
    print(f"Using Database: {engine.url}")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        clean_db(db, DEMO_EMAIL)
        
        # 1. Create User
        print("Creating User...")
        user = models.User(
            id=str(uuid.uuid4()),
            email=DEMO_EMAIL,
            name=DEMO_NAME,
            currency_symbol="$",
            created_at=datetime.now() - timedelta(days=450),
            mfa_enabled=False
        )
        # Note: password hash not needed for Supabase auth usually but good to have for local
        # We store it for completeness if the auth provider syncs
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 2. Create Household Members
        print("Creating Members...")
        member_map = {} # Name -> ID
        for m in MEMBERS:
            member = models.HouseholdMember(
                user_id=user.id,
                name=m["name"],
                color=m["color"],
                avatar=m["avatar"]
            )
            db.add(member)
            db.flush() # Get ID
            member_map[m["name"]] = member
        db.commit()
        
        # 3. Create Accounts & Holdings
        print("Creating Accounts...")
        account_map = {} # Name -> ID
        for acc in ACCOUNTS:
            account = models.Account(
                user_id=user.id,
                name=acc["name"],
                type=acc["type"],
                category=acc["category"],
                balance=acc["balance"]
            )
            db.add(account)
            db.flush()
            account_map[acc["name"]] = account
            
            # Add Holdings if Joint Portfolio
            if acc["name"] == "Joint Portfolio":
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
                account.balance = total_value # Update balance to match holdings
        
        db.commit()
        
        # 4. Create Categories (Hierarchical)
        print("Creating Categories...")
        bucket_map = {} # Name -> Bucket Object
        
        display_order = 0
        for cat in CATEGORIES:
            # Parent
            parent = models.BudgetBucket(
                user_id=user.id,
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
            
            # Check for limit on parent (rare, usually on children)
            if "limit" in cat and isinstance(cat["limit"], (int, float)) and cat["limit"] > 0:
                 db.add(models.BudgetLimit(bucket_id=parent.id, member_id=None, amount=cat["limit"]))
            
            # Children
            if "children" in cat:
                child_order = 0
                for child in cat["children"]:
                    child_bucket = models.BudgetBucket(
                        user_id=user.id,
                        name=child["name"],
                        icon_name=child.get("icon", "Circle"),
                        group=child.get("group", cat.get("group")), # Inherit or override
                        is_shared=child.get("is_shared", cat.get("is_shared")),
                        parent_id=parent.id,
                        display_order=child_order
                    )
                    db.add(child_bucket)
                    db.flush()
                    bucket_map[child["name"]] = child_bucket
                    child_order += 1
                    
                    # Limits
                    if "limit" in child:
                        limit_val = child["limit"]
                        if isinstance(limit_val, dict): # Split limit
                            for mem_name, amount in limit_val.items():
                                if mem_name in member_map:
                                    db.add(models.BudgetLimit(
                                        bucket_id=child_bucket.id,
                                        member_id=member_map[mem_name].id,
                                        amount=amount
                                    ))
                        elif limit_val > 0: # Shared limit
                             db.add(models.BudgetLimit(bucket_id=child_bucket.id, member_id=None, amount=limit_val))

        db.commit()
        
        # 5. Create Goals
        print("Creating Goals...")
        for g in GOALS:
            goal = models.Goal(
                user_id=user.id,
                name=g["name"],
                target_amount=g["target"],
                target_date=date.today() + timedelta(days=g["date_offset"]),
                linked_account_id=account_map["Offset Account"].id # Link to savings
            )
            db.add(goal)
            # We don't populate 'current' directly as it's computed or transaction based, 
            # but for this simple model we rely on the account balance or transactions linking to it.
            # In V5 schema, Goal doesn't have a 'current' field stored, it's computed.
        
        # 6. Create Subscriptions
        print("Creating Subscriptions...")
        for sub in SUBSCRIPTIONS:
            bucket = bucket_map.get(sub["cat"])
            s = models.Subscription(
                user_id=user.id,
                name=sub["name"],
                amount=sub["amount"],
                frequency=sub["freq"],
                bucket_id=bucket.id if bucket else None,
                next_due_date=date.today() + timedelta(days=random.randint(1, 28)),
                is_active=True
            )
            db.add(s)
        
        db.commit()
        
        # 7. Generate Transactions (The heavy lifting)
        print("Generating Transactions (14 months)...")
        transactions = []
        
        # Timeframe
        end_date = date.today()
        start_date = end_date - timedelta(days=14*30)
        current_date = start_date
        
        # Pay Cycles (Fortnightly)
        # Adam: Start date + 0
        # Eve: Start date + 7 (Offset pay weeks)
        
        while current_date <= end_date:
            days_since_start = (current_date - start_date).days
            is_weekend = current_date.weekday() >= 5
            day_of_month = current_date.day
            month = current_date.month
            
            # --- Narrative Arcs ---
            
            # 1. VACATION (July, ~10th-20th) - Skip daily grind, add travel
            is_vacation = (month == 7 and 10 <= day_of_month <= 20)
            
            if is_vacation:
                # Travel Spending
                if random.random() < 0.8: # High chance of spend
                    amt = random.uniform(50, 300)
                    desc = random.choice(["Osteria Roma", "Hotel Bar", "Museum Ticket", "Train to Florence", "Gelato"])
                    transactions.append(models.Transaction(
                        user_id=user.id, date=json_date(current_date), description=desc, raw_description=desc, amount=-amt,
                        bucket_id=bucket_map["Travel"].id, spender="Joint", is_verified=True, account_id=account_map["Joint Everyday"].id
                    ))
                current_date += timedelta(days=1)
                continue # Skip regular logic
            
            # --- Regular Income ---
            
            # Adam Pay (Fortnightly)
            if days_since_start % 14 == 0:
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Payroll - TechCorp", raw_description="DIRECT CREDIT TECHCORP SALARY",
                    amount=2770.00, bucket_id=bucket_map["Salary"].id, spender="Adam", is_verified=True, account_id=account_map["Adam Personal"].id
                ))
                # Internal Transfer to Joint
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Transfer to Joint", raw_description="Transfer",
                    amount=-1500.00, bucket_id=bucket_map["Savings Transfer"].id, spender="Adam", is_verified=True, account_id=account_map["Adam Personal"].id
                ))
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Transfer from Adam", raw_description="Transfer",
                    amount=1500.00, bucket_id=bucket_map["Savings Transfer"].id, spender="Joint", is_verified=True, account_id=account_map["Joint Everyday"].id
                ))

            # Eve Pay (Fortnightly, offset by 7 days)
            if (days_since_start + 7) % 14 == 0:
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Payroll - LawFirm", raw_description="DIRECT CREDIT LAWFIRM SALARY",
                    amount=3460.00, bucket_id=bucket_map["Salary"].id, spender="Eve", is_verified=True, account_id=account_map["Eve Personal"].id
                ))
                # Internal Transfer to Joint
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Transfer to Joint", raw_description="Transfer",
                    amount=-2000.00, bucket_id=bucket_map["Savings Transfer"].id, spender="Eve", is_verified=True, account_id=account_map["Eve Personal"].id
                ))
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Transfer from Eve", raw_description="Transfer",
                    amount=2000.00, bucket_id=bucket_map["Savings Transfer"].id, spender="Joint", is_verified=True, account_id=account_map["Joint Everyday"].id
                ))

            # --- Fixed Bills ---
            
            # Mortgage (1st of month)
            if day_of_month == 1:
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description="Mortgage Payment", raw_description="HOME LOAN REPAYMENT",
                    amount=-3200.00, bucket_id=bucket_map["Mortgage Repayment"].id, spender="Joint", is_verified=True, account_id=account_map["Joint Everyday"].id
                ))
            
            # --- Daily Grind (The Volume) ---
            
            # Coffee (High freq)
            if not is_weekend and random.random() < 0.8:
                create_txn(transactions, user, current_date, "Coffee", bucket_map, account_map, member_map, "Adam")
            if not is_weekend and random.random() < 0.7:
                 create_txn(transactions, user, current_date, "Coffee", bucket_map, account_map, member_map, "Eve")
            
            # Transport (Work days)
            if not is_weekend:
                 if random.random() < 0.9: create_txn(transactions, user, current_date, "Public Transport", bucket_map, account_map, member_map, "Adam")
                 if random.random() < 0.9: create_txn(transactions, user, current_date, "Public Transport", bucket_map, account_map, member_map, "Eve")
            
            # Lunch/Snacks
            if not is_weekend and random.random() < 0.6:
                desc = random.choice(["Sushi Roll", "Sandwich", "Salad Bar", "Bakery Treat"])
                amt = random.uniform(12, 22)
                spender = random.choice(["Adam", "Eve"])
                acc = account_map[f"{spender} Personal"]
                transactions.append(models.Transaction(
                    user_id=user.id, date=json_date(current_date), description=desc, raw_description=desc.upper(), amount=-round(amt, 2),
                    bucket_id=bucket_map["Dining Out"].id, spender=spender, is_verified=random.random()>0.2, account_id=acc.id
                ))

            # Groceries (2-3 times a week)
            if random.random() < 0.35:
                create_txn(transactions, user, current_date, "Groceries", bucket_map, account_map, member_map, "Joint")
                
            # Dining Out (Weekends usually)
            if is_weekend and random.random() < 0.5:
                 create_txn(transactions, user, current_date, "Dining Out", bucket_map, account_map, member_map, "Joint")
            
            # Shopping / Misc
            if random.random() < 0.15: # Random shopping
                cat = random.choice(["Clothing", "Electronics", "Household", "Personal Care"])
                spender = random.choice(["Adam", "Eve", "Joint"])
                create_txn(transactions, user, current_date, cat, bucket_map, account_map, member_map, spender)
                
            # --- Special Narratives ---
            
            # October Emergency
            if month == 10 and day_of_month == 15:
                transactions.append(models.Transaction(
                     user_id=user.id, date=json_date(current_date), description="UltraTune Mechanic", raw_description="ULTRATUNE REPAIRS",
                     amount=-645.50, bucket_id=bucket_map["Maintenance"].id, spender="Joint", is_verified=True, account_id=account_map["Joint Everyday"].id,
                     notes="Emergency brake repairs :("
                ))
            
            # December Bonus
            if month == 12 and day_of_month == 15:
                 transactions.append(models.Transaction(
                     user_id=user.id, date=json_date(current_date), description="Annual Bonus", raw_description="PAYROLL BONUS",
                     amount=8500.00, bucket_id=bucket_map["Bonus"].id, spender="Eve", is_verified=True, account_id=account_map["Eve Personal"].id
                ))
                 # Splurge purchase same day
                 transactions.append(models.Transaction(
                     user_id=user.id, date=json_date(current_date), description="David Jones (Bag)", raw_description="DAVID JONES RETAIL",
                     amount=-2400.00, bucket_id=bucket_map["Clothing"].id, spender="Eve", is_verified=True, account_id=account_map["Eve Personal"].id,
                     notes="Treat yourself!"
                ))
            
            # Increment day
            current_date += timedelta(days=1)
            
        print(f"Generated {len(transactions)} transactions.")
        
        # Add transactions to DB in chunks
        chunk_size = 500
        for i in range(0, len(transactions), chunk_size):
            db.bulk_save_objects(transactions[i:i + chunk_size])
            db.commit()
            print(f"Saved chunk {i//chunk_size + 1}...")
            
        print("\n" + "="*60)
        print("SEEDING COMPLETE!")
        print("="*60)
        print(f"User: {DEMO_EMAIL}")
        print(f"Pass: {DEMO_PASSWORD}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def create_txn(transactions, user, date_obj, cat_name, bucket_map, account_map, member_map, spender):
    """Helper to create a random transaction for a category."""
    pool = MERCHANTS.get(cat_name)
    if not pool: return

    merchant, min_amt, max_amt = random.choice(pool)
    amt = random.uniform(min_amt, max_amt)
    
    # Account Logic
    if spender == "Joint":
        acc = account_map["Joint Everyday"]
    else:
        acc = account_map[f"{spender} Personal"]
    
    # Bucket Logic
    bucket = bucket_map.get(cat_name)
    
    transactions.append(models.Transaction(
        user_id=user.id,
        date=json_date(date_obj),
        description=merchant,
        raw_description=merchant.upper() + " SYDNEY AU",
        amount=-round(amt, 2),
        bucket_id=bucket.id if bucket else None,
        spender=spender,
        is_verified=random.random() > 0.1,
        account_id=acc.id
    ))

def json_date(date_obj):
    """Combine date with random time for datetime field."""
    t = get_random_time()
    return datetime.combine(date_obj, t)

if __name__ == "__main__":
    seed_data()
