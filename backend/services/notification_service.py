from sqlalchemy.orm import Session
from .. import models

class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, type: str, message: str, meta_data: str = None):
        """
        Create a new notification for a user.
        """
        notification = models.Notification(
            user_id=user_id,
            type=type,
            message=message,
            meta_data=meta_data
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
