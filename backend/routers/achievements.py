from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from .. import models
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/achievements",
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

# --- Helper to generate tiers ---
def generate_tiers(category_name: str, verb: str) -> List[Tier]:
    tiers_data = [
        (1, "Wood", "Baby Steps", f"Start your {category_name.lower()} journey", "🪵"),
        (2, "Stone", "Solid Foundation", f"Build a solid {category_name.lower()} base", "🪨"),
        (3, "Bronze", "Getting Serious", f"Show consistent {category_name.lower()}", "🥉"),
        (4, "Silver", "Momentum Builder", f"Accelerate your {category_name.lower()}", "🥈"),
        (5, "Gold", "High Performer", f"Master the art of {category_name.lower()}", "🥇"),
        (6, "Platinum", "Elite Status", f"Reach elite {category_name.lower()} levels", "💠"),
        (7, "Diamond", "Financial Master", f"Become a {category_name.lower()} master", "💎"),
        (8, "Champion", "Legendary", f"Be a legendary {category_name.lower()} expert", "🏆"),
    ]
    
    return [
        Tier(
            tier=t[0],
            tier_name=t[1],
            name=t[2],
            description=t[3],
            is_earned=False, # Default to False for now
            tier_icon=t[4]
        ) for t in tiers_data
    ]

# --- Endpoints ---

@router.get("/summary", response_model=AchievementsResponse)
def get_achievements(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user achievements, progress, and tiers.
    Currently returns a full mocked structure matching the frontend expectations.
    """
    
    # Define the 8 categories expected by frontend
    category_defs = [
        ("budget", "Budgeting", "maintain a budget"),
        ("savings", "Savings", "save money"),
        ("income", "Income", "grow income"),
        ("investments", "Investments", "invest wisely"),
        ("net_worth", "Net Worth", "build wealth"),
        ("organization", "Organization", "stay organized"),
        ("consistency", "Consistency", "maintain streaks"),
        ("goals", "Goals", "achieve goals"),
    ]
    
    categories = []
    
    # In a real implementation we would calculate progress here
    # For now, return the basic structure (Tier 0 / Not Started)
    
    for cat_id, cat_name, verb in category_defs:
        categories.append(Category(
            id=cat_id,
            name=cat_name,
            current_tier=0,
            progress_to_next=0.0,
            tiers=generate_tiers(cat_name, verb)
        ))

    return {
        "summary": {
            "total_earned": 0,
            "total_possible": 64, # 8 categories * 8 tiers
            "completion_rate": 0
        },
        "categories": categories
    }
