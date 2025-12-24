"""
Test script for Goal Milestone Celebrations.
Tests the goal progress notification system.
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal
from backend.services.notification_service import NotificationService
from backend.models import User, Goal, Notification
from datetime import datetime

def test_goal_milestones():
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).first()
        if not user:
            print("No user found")
            return
        
        print(f"Testing for user: {user.email}")
        
        # Check for existing goals
        goals = db.query(Goal).filter(Goal.user_id == user.id).all()
        
        print(f"\nExisting goals: {len(goals)}")
        for goal in goals:
            print(f"  - {goal.name}: ${goal.target_amount} (linked account: {goal.linked_account_id})")
        
        if not goals:
            print("\nNo goals found. Creating a test goal...")
            test_goal = Goal(
                user_id=user.id,
                name="Test Emergency Fund",
                target_amount=1000,
                linked_account_id=None
            )
            db.add(test_goal)
            db.commit()
            db.refresh(test_goal)
            print(f"Created goal: {test_goal.name} with target ${test_goal.target_amount}")
            goals = [test_goal]
        
        # Clear previous goal notifications
        deleted = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.type == "goal"
        ).delete(synchronize_session=False)
        db.commit()
        print(f"\nCleared {deleted} previous goal notifications")
        
        # Test check_all_goal_milestones
        print("\n--- Testing check_all_goal_milestones ---")
        notifications = NotificationService.check_all_goal_milestones(db, user.id)
        print(f"Notifications created: {len(notifications)}")
        for n in notifications:
            print(f"  🎉 {n.message}")
        
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
    test_goal_milestones()
