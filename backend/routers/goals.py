from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)

@router.get("/", response_model=List[schemas.Goal])
def get_goals(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    
    # Calculate current_amount for each goal
    for goal in goals:
        if goal.linked_account_id:
            # Linked Mode: Fetch latest balance from NetWorthSnapshot (if available)
            # This is complex because we need the snapshot history. 
            # Simplified approach: Check if Account has a "holdings" value or sum transactions?
            # Actually, `Account` model doesn't store balance. `AccountBalance` table does.
            # Let's get the LATEST snapshot for this user.
            latest_snapshot = db.query(models.NetWorthSnapshot)\
                .filter(models.NetWorthSnapshot.user_id == current_user.id)\
                .order_by(models.NetWorthSnapshot.date.desc())\
                .first()
            
            goal.current_amount = 0.0
            if latest_snapshot:
                # Find balance for this account
                # We need to query AccountBalance directly
                balance_entry = db.query(models.AccountBalance)\
                    .filter(
                        models.AccountBalance.snapshot_id == latest_snapshot.id,
                        models.AccountBalance.account_id == goal.linked_account_id
                    ).first()
                if balance_entry:
                    goal.current_amount = balance_entry.balance
        else:
            # Manual Mode: Sum of linked transactions
            # Note: Transactions can be negative (spending) or positive (income).
            # Usually users link POSITIVE transfers/savings to a goal.
            # But if they link expenses, it might be weird.
            # We will simple Sum(amount). If it's a "Savings Goal", we expect positive transfers in.
            # Logic: Sum(amount) of all transactions linked to this goal.
            total = db.query(func.sum(models.Transaction.amount))\
                .filter(
                    models.Transaction.goal_id == goal.id, 
                    models.Transaction.user_id == current_user.id
                ).scalar()
            goal.current_amount = total if total else 0.0

    return goals

@router.post("/", response_model=schemas.Goal)
def create_goal(
    goal: schemas.GoalCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_goal = models.Goal(**goal.dict(), user_id=current_user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/{goal_id}", response_model=schemas.Goal)
def update_goal(
    goal_id: int,
    goal_update: schemas.GoalUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    for key, value in goal_update.dict(exclude_unset=True).items():
        setattr(db_goal, key, value)
    
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Unlink transactions before deleting
    db.query(models.Transaction).filter(models.Transaction.goal_id == goal_id).update({"goal_id": None})
    
    db.delete(db_goal)
    db.commit()
    return {"ok": True}

@router.get("/{goal_id}/history")
def get_goal_history(
    goal_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    history = []
    
    if goal.linked_account_id:
        # Linked Mode: Fetch history from AccountBalance snapshots
        # Join NetWorthSnapshot to get the date
        results = db.query(
            models.NetWorthSnapshot.date, 
            models.AccountBalance.balance
        ).join(
            models.AccountBalance, 
            models.AccountBalance.snapshot_id == models.NetWorthSnapshot.id
        ).filter(
            models.NetWorthSnapshot.user_id == current_user.id,
            models.AccountBalance.account_id == goal.linked_account_id
        ).order_by(models.NetWorthSnapshot.date.asc()).all()
        
        for date, balance in results:
            history.append({"date": date.strftime("%Y-%m-%d"), "amount": balance})
            
    else:
        # Manual Mode: Cumulative sum of linked transactions
        transactions = db.query(models.Transaction)\
            .filter(
                models.Transaction.goal_id == goal.id,
                models.Transaction.user_id == current_user.id
            )\
            .order_by(models.Transaction.date.asc())\
            .all()
            
        current_total = 0.0
        # Group by date to avoid multiple points per day (optional, but cleaner)
        grouped_by_date = {}
        
        for txn in transactions:
            d = txn.date.strftime("%Y-%m-%d")
            if d not in grouped_by_date:
                grouped_by_date[d] = 0.0
            grouped_by_date[d] += txn.amount
            
        # Create cumulative series
        sorted_dates = sorted(grouped_by_date.keys())
        for d in sorted_dates:
            current_total += grouped_by_date[d]
            history.append({"date": d, "amount": current_total})
            
    return history
