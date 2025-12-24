import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal
from backend.services.notification_service import NotificationService
from backend.models import User

def create_test_notification():
    db = SessionLocal()
    try:
        # Get first user
        user = db.query(User).first()
        if not user:
            print("No user found")
            return

        print(f"Creating notification for user: {user.email}")
        
        NotificationService.create_notification(
            db,
            user_id=user.id,
            type="system",
            message="Welcome to your new Notification Center! 🔔",
            meta_data=None
        )
        print("Notification created successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_notification()
