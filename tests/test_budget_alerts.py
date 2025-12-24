"""
Test script to verify Budget Exceeded Alerts functionality.
Creates transactions to trigger budget threshold notifications.
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal
from backend.services.notification_service import NotificationService
from backend.models import User, BudgetBucket, BudgetLimit, Transaction, Notification
from datetime import datetime

def test_budget_alerts():
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).first()
        if not user:
            print("No user found")
            return
        
        print(f"Testing for user: {user.email}")
        
        # Get a bucket with a limit
        bucket_with_limit = db.query(BudgetBucket).join(BudgetLimit).filter(
            BudgetBucket.user_id == user.id,
            BudgetLimit.amount > 0
        ).first()
        
        if not bucket_with_limit:
            print("No bucket with limit found. Creating test limit...")
            # Find any bucket
            bucket = db.query(BudgetBucket).filter(BudgetBucket.user_id == user.id).first()
            if not bucket:
                print("No buckets found")
                return
            
            # Get first household member
            from backend.models import HouseholdMember
            member = db.query(HouseholdMember).filter(HouseholdMember.user_id == user.id).first()
            if not member:
                print("No household member found")
                return
            
            # Create a small limit for testing
            test_limit = BudgetLimit(bucket_id=bucket.id, member_id=member.id, amount=100)
            db.add(test_limit)
            db.commit()
            bucket_with_limit = bucket
            print(f"Created test limit of $100 for '{bucket.name}'")
        
        print(f"\nTesting bucket: '{bucket_with_limit.name}' (ID: {bucket_with_limit.id})")
        
        # Get budget limit
        total_limit = db.query(BudgetLimit).filter(BudgetLimit.bucket_id == bucket_with_limit.id).all()
        limit_amount = sum(l.amount for l in total_limit)
        print(f"Total limit: ${limit_amount}")
        
        # Get current spending this month
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        from sqlalchemy import func
        current_spent = abs(db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user.id,
            Transaction.bucket_id == bucket_with_limit.id,
            Transaction.date >= month_start,
            Transaction.amount < 0
        ).scalar() or 0)
        print(f"Current spending this month: ${current_spent}")
        print(f"Current percent: {(current_spent/limit_amount*100) if limit_amount > 0 else 0:.1f}%")
        
        # Clear previous test notifications
        deleted = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.type == "budget",
            Notification.meta_data.contains(f'"bucket_id": {bucket_with_limit.id}')
        ).delete(synchronize_session=False)
        db.commit()
        print(f"\nCleared {deleted} previous budget notifications for this bucket")
        
        # Test the check function
        print("\n--- Testing check_budget_exceeded ---")
        notification = NotificationService.check_budget_exceeded(db, user.id, bucket_with_limit.id)
        
        if notification:
            print(f"✅ Notification created: {notification.message}")
            print(f"   Meta: {notification.meta_data}")
        else:
            print("ℹ️ No notification created (spending likely below 80% threshold)")
            
        # Show all current notifications
        print("\n--- Current Notifications ---")
        all_notifs = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(5).all()
        for n in all_notifs:
            print(f"  [{n.type}] {n.message} (read: {n.is_read})")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_budget_alerts()
