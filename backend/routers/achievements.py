from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from .. import models
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    tags=["achievements"],
    responses={404: {"description": "Not found"}},
)

# --- Schema Models (Internal for now, can move to schemas.py later) ---

class Tier(BaseModel):
    tier: int
    tier_name: str
    name: str
    description: str
    is_earned: bool
    tier_icon: str

class Category(BaseModel):
    id: str
    name: str
    current_tier: int
    progress_to_next: float
    tiers: List[Tier]

class AchievementSummary(BaseModel):
    total_earned: int
    total_possible: int
    completion_rate: int

class AchievementsResponse(BaseModel):
    summary: AchievementSummary
    categories: List[Category]

# --- Endpoints ---

@router.get("/", response_model=AchievementsResponse)
def get_achievements(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user achievements, progress, and tiers.
    Currently returns a mocked structure properly formatted for the frontend.
    """
    
    # Mock data structure matching frontend expectations
    # In future: Calculate this from real data (budgets, savings, etc.)
    
    return {
        "summary": {
            "total_earned": 0,
            "total_possible": 64,
            "completion_rate": 0
        },
        "categories": [
            {
                "id": "budget",
                "name": "Budgeting",
                "current_tier": 0,
                "progress_to_next": 0.0,
                "tiers": []
            },
            {
                "id": "savings",
                "name": "Savings",
                "current_tier": 0,
                "progress_to_next": 0.0,
                "tiers": []
            },
             {
                "id": "net_worth",
                "name": "Net Worth",
                "current_tier": 0,
                "progress_to_next": 0.0,
                "tiers": []
            }
        ]
    }
