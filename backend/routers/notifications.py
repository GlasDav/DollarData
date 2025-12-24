from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

@router.get("/", response_model=List[schemas.Notification])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get notifications for the current user.
    """
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    
    return query.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/{notification_id}/read", response_model=schemas.Notification)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark all notifications for the user as read.
    """
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({models.Notification.is_read: True})
    
    db.commit()
    return {"message": "All marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete a notification.
    """
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}

@router.get("/upcoming-bills")
def get_upcoming_bills(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get subscriptions/bills due within the next X days.
    """
    from ..services.notification_service import NotificationService
    
    upcoming = NotificationService.get_upcoming_bills(db, current_user.id, days)
    
    return [{
        "id": sub.id,
        "name": sub.name,
        "amount": sub.amount,
        "frequency": sub.frequency,
        "next_due_date": sub.next_due_date.isoformat() if sub.next_due_date else None,
        "days_until": (sub.next_due_date - __import__('datetime').datetime.utcnow().date()).days if sub.next_due_date else None
    } for sub in upcoming]

@router.post("/check-bills")
def trigger_bill_check(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Manually trigger check for upcoming bills (creates notifications).
    """
    from ..services.notification_service import NotificationService
    
    notifications = NotificationService.check_upcoming_bills(db, current_user.id, days_ahead=3)
    
    return {
        "message": f"Created {len(notifications)} bill reminder(s)",
        "notifications": [n.message for n in notifications]
    }

