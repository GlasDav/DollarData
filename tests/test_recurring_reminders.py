"""
Test script for Recurring Transaction Reminders.
Creates test subscriptions and verifies bill notifications work.
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal
from backend.services.notification_service import NotificationService
from backend.models import User, Subscription, Notification
from datetime import datetime, timedelta

def test_recurring_reminders():
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).first()
        if not user:
            print("No user found")
            return
        
        print(f"Testing for user: {user.email}")
        
        # Check for existing subscriptions
        subs = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.is_active == True
        ).all()
        
        print(f"\nExisting active subscriptions: {len(subs)}")
        for sub in subs:
            print(f"  - {sub.name}: ${sub.amount} ({sub.frequency}), due: {sub.next_due_date}")
        
        # Create test subscription if none due soon
        today = datetime.utcnow().date()
        tomorrow = today + timedelta(days=1)
        
        test_sub = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.name == "Test Netflix"
        ).first()
        
        if not test_sub:
            print("\nCreating test subscription due tomorrow...")
            test_sub = Subscription(
                user_id=user.id,
                name="Test Netflix",
                amount=-15.99,
                type="Expense",
                frequency="monthly",
                next_due_date=tomorrow,
                is_active=True,
                description_keyword="netflix"
            )
            db.add(test_sub)
            db.commit()
            print(f"Created: {test_sub.name} due {test_sub.next_due_date}")
        else:
            # Update due date to tomorrow for testing
            test_sub.next_due_date = tomorrow
            test_sub.is_active = True
            db.commit()
            print(f"\nUpdated {test_sub.name} due date to {test_sub.next_due_date}")
        
        # Clear previous test notifications
        deleted = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.type == "bill"
        ).delete(synchronize_session=False)
        db.commit()
        print(f"\nCleared {deleted} previous bill notifications")
        
        # Test get_upcoming_bills
        print("\n--- Testing get_upcoming_bills ---")
        upcoming = NotificationService.get_upcoming_bills(db, user.id, days_ahead=7)
        print(f"Bills due in next 7 days: {len(upcoming)}")
        for bill in upcoming:
            print(f"  - {bill.name}: ${abs(bill.amount)} due {bill.next_due_date}")
        
        # Test check_upcoming_bills (creates notifications)
        print("\n--- Testing check_upcoming_bills ---")
        notifications = NotificationService.check_upcoming_bills(db, user.id, days_ahead=3)
        print(f"Notifications created: {len(notifications)}")
        for n in notifications:
            print(f"  ✅ {n.message}")
        
        # Show all current notifications
        print("\n--- Current Notifications ---")
        all_notifs = db.query(Notification).filter(
            Notification.user_id == user.id
        ).order_by(Notification.created_at.desc()).limit(5).all()
        for n in all_notifs:
            print(f"  [{n.type}] {n.message}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_recurring_reminders()
