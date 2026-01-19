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
    # Ensure user_id is a string for compatibility with String columns (UUIDs stored as strings)
    user_id = str(current_user.id)
    user_email = current_user.email
    
    # 1. Family Sharing Cleanup
    
    # Update profile to remove household link first (break circular dependency)
    current_user.household_id = None
    db.add(current_user)
    db.flush()
    
    # Delete household memberships (being a member)
    db.query(models.HouseholdUser).filter(models.HouseholdUser.user_id == user_id).delete(synchronize_session=False)
    
    # Find households owned by this user
    # Find households owned by this user
    owned_households = db.query(models.Household).filter(models.Household.owner_id == user_id).all()
    owned_household_ids = [h.id for h in owned_households]
    
    if owned_household_ids:
        # Delete invites for these households
        db.query(models.HouseholdInvite).filter(models.HouseholdInvite.household_id.in_(owned_household_ids)).delete(synchronize_session=False)
        # Delete members of these households
        db.query(models.HouseholdUser).filter(models.HouseholdUser.household_id.in_(owned_household_ids)).delete(synchronize_session=False)
        # Delete the households themselves
        db.query(models.Household).filter(models.Household.id.in_(owned_household_ids)).delete(synchronize_session=False)
    
    # Force flush to ensure households are deleted before we try to delete the user
    # avoiding "violates foreign key constraint households_owner_id_fkey"
    db.flush()
    
    # Delete invites sent by this user (to other households)
    db.query(models.HouseholdInvite).filter(models.HouseholdInvite.invited_by_id == user_id).delete(synchronize_session=False)
    
    # 2. General Data Cleanup
    
    # Delete related tokens
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user_id).delete(synchronize_session=False)
    db.query(models.EmailVerificationToken).filter(models.EmailVerificationToken.user_id == user_id).delete(synchronize_session=False)
    
    # Delete notifications and settings
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete(synchronize_session=False)
    db.query(models.NotificationSettings).filter(models.NotificationSettings.user_id == user_id).delete(synchronize_session=False)
    
    # Delete API keys
    db.query(models.ApiKey).filter(models.ApiKey.user_id == user_id).delete(synchronize_session=False)
    
    # Delete background jobs
    db.query(models.Job).filter(models.Job.user_id == user_id).delete(synchronize_session=False)
    
    # Delete household members (the people/spenders list, not household users)
    db.query(models.HouseholdMember).filter(models.HouseholdMember.user_id == user_id).delete(synchronize_session=False)
    
    # Delete category goals
    db.query(models.CategoryGoal).filter(models.CategoryGoal.user_id == user_id).delete(synchronize_session=False)
    
    db.query(models.Transaction).filter(models.Transaction.user_id == user_id).delete(synchronize_session=False)
    db.query(models.CategorizationRule).filter(models.CategorizationRule.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Subscription).filter(models.Subscription.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Goal).filter(models.Goal.user_id == user_id).delete(synchronize_session=False)
    db.query(models.TaxSettings).filter(models.TaxSettings.user_id == user_id).delete(synchronize_session=False)
    
    # Accounts and holdings
    account_ids = [a.id for a in db.query(models.Account).filter(models.Account.user_id == user_id).all()]
    if account_ids:
        db.query(models.InvestmentHolding).filter(models.InvestmentHolding.account_id.in_(account_ids)).delete(synchronize_session=False)
        # Delete manual trade entries if any (assuming they cascade or added logic here if needed)
        # Assuming Trade model has account_id
        try:
            db.query(models.Trade).filter(models.Trade.account_id.in_(account_ids)).delete(synchronize_session=False)
        except AttributeError:
             pass # In case Trade model is not imported or different

    
    # Snapshots
    snapshot_ids = [s.id for s in db.query(models.NetWorthSnapshot).filter(models.NetWorthSnapshot.user_id == user_id).all()]
    if snapshot_ids:
        db.query(models.AccountBalance).filter(models.AccountBalance.snapshot_id.in_(snapshot_ids)).delete(synchronize_session=False)
    
    db.query(models.NetWorthSnapshot).filter(models.NetWorthSnapshot.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Account).filter(models.Account.user_id == user_id).delete(synchronize_session=False)
    db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user_id).delete(synchronize_session=False)
    
    # 3. Final Profile Deletion
    # Check if user is still referenced explicitly before deleting (debugging step if needed, but proceeding)
    db.query(models.User).filter(models.User.id == user_id).delete(synchronize_session=False)
    
    db.commit()
    
    # 4. Delete from Supabase Auth (Admin)
    from supabase import create_client, Client
    from ..config import settings
    
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            # Use the admin api to delete the user
            supabase.auth.admin.delete_user(user_id)
            logger.info(f"Supabase Auth identity deleted for user: {user_email}")
        except Exception as e:
            # Log but don't fail the request since local data is already gone
            logger.error(f"Failed to delete Supabase Auth identity for {user_email}: {e}")
    else:
        logger.warning(f"Skipping Supabase Auth deletion for {user_email} (Keys missing)")

    logger.info(f"Account deleted successfully: {user_email}")
    return {"message": "Your account and all data have been permanently deleted."}
