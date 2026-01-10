import logging
import os
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from .. import models, schemas, auth, database

logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)





@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """Get current authenticated user's profile."""
    return current_user


@router.delete("/account", response_model=schemas.MessageResponse)
@limiter.limit("3/minute")
def delete_account(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Permanently delete the user account and all associated data.
    """
    user_id = current_user.id
    user_email = current_user.email
    
    # Delete all related data in order
    
    # Delete related tokens (if table still exists, otherwise ignore)
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user_id).delete()
    db.query(models.EmailVerificationToken).filter(models.EmailVerificationToken.user_id == user_id).delete()
    
    db.query(models.Transaction).filter(models.Transaction.user_id == user_id).delete()
    db.query(models.CategorizationRule).filter(models.CategorizationRule.user_id == user_id).delete()
    db.query(models.Subscription).filter(models.Subscription.user_id == user_id).delete()
    db.query(models.Goal).filter(models.Goal.user_id == user_id).delete()
    db.query(models.TaxSettings).filter(models.TaxSettings.user_id == user_id).delete()
    
    # Accounts and holdings
    account_ids = [a.id for a in db.query(models.Account).filter(models.Account.user_id == user_id).all()]
    if account_ids:
        db.query(models.InvestmentHolding).filter(models.InvestmentHolding.account_id.in_(account_ids)).delete(synchronize_session=False)
    
    # Snapshots
    snapshot_ids = [s.id for s in db.query(models.NetWorthSnapshot).filter(models.NetWorthSnapshot.user_id == user_id).all()]
    if snapshot_ids:
        db.query(models.AccountBalance).filter(models.AccountBalance.snapshot_id.in_(snapshot_ids)).delete(synchronize_session=False)
    
    db.query(models.NetWorthSnapshot).filter(models.NetWorthSnapshot.user_id == user_id).delete()
    db.query(models.Account).filter(models.Account.user_id == user_id).delete()
    db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user_id).delete()
    
    # Finally, delete the user (Profile)
    db.query(models.User).filter(models.User.id == user_id).delete()
    
    db.commit()
    
    logger.info(f"Account deleted: {user_email}")
    return {"message": "Your account and all data have been permanently deleted."}
