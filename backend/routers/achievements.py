"""
Achievements Router - Tiered achievement progression system.

Categories: budget, savings, income, investments, net_worth, organization, consistency, goals
Tiers: 1-8 (Wood -> Stone -> Bronze -> Silver -> Gold -> Platinum -> Diamond -> Champion)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import List, Optional
from ..database import get_db
from .. import models, auth

router = APIRouter(prefix="/achievements", tags=["Achievements"])

# ============================================
# TIER DEFINITIONS
# ============================================

TIERS = {
    1: {"name": "Wood", "color": "#8B4513", "icon": "🪵"},
    2: {"name": "Stone", "color": "#6B7280", "icon": "🪨"},
    3: {"name": "Bronze", "color": "#CD7F32", "icon": "🥉"},
    4: {"name": "Silver", "color": "#C0C0C0", "icon": "🥈"},
    5: {"name": "Gold", "color": "#FFD700", "icon": "🥇"},
    6: {"name": "Platinum", "color": "#E5E4E2", "icon": "💎"},
    7: {"name": "Diamond", "color": "#B9F2FF", "icon": "💠"},
    8: {"name": "Champion", "color": "#FF6B35", "icon": "🏆"},
}

# ============================================
# ACHIEVEMENT DEFINITIONS
# ============================================

ACHIEVEMENTS = {
    "budget": {
        "name": "Budget",
        "icon": "Target",
        "color": "indigo",
        "tiers": {
            1: {"name": "Budget Beginner", "description": "Create your first budget category"},
            2: {"name": "Budget Keeper", "description": "Stay under budget for 1 month"},
            3: {"name": "Budget Guardian", "description": "Stay under budget for 3 months"},
            4: {"name": "Budget Master", "description": "Stay under budget for 6 months"},
            5: {"name": "Budget Warrior", "description": "Stay under budget for 12 months"},
            6: {"name": "Budget Champion", "description": "Stay under budget for 24 months"},
            7: {"name": "Budget Legend", "description": "Stay under budget for 36 months"},
            8: {"name": "Budget Immortal", "description": "Stay under budget for 60 months"},
        }
    },
    "savings": {
        "name": "Emergency Fund",
        "icon": "Shield",
        "color": "emerald",
        "tiers": {
            1: {"name": "Safety Net Started", "description": "1 month of expenses saved"},
            2: {"name": "One Month Buffer", "description": "2 months of expenses saved"},
            3: {"name": "Safety Cushion", "description": "3 months of expenses saved"},
            4: {"name": "Solid Foundation", "description": "6 months of expenses saved"},
            5: {"name": "Well Prepared", "description": "9 months of expenses saved"},
            6: {"name": "Full Year Covered", "description": "12 months of expenses saved"},
            7: {"name": "Ultra Secure", "description": "18 months of expenses saved"},
            8: {"name": "Financially Invincible", "description": "24+ months of expenses saved"},
        }
    },
    "investments": {
        "name": "Investments",
        "icon": "TrendingUp",
        "color": "violet",
        "tiers": {
            1: {"name": "First Trade", "description": "Add your first investment"},
            2: {"name": "Portfolio Started", "description": "Own 3+ different holdings"},
            3: {"name": "Diversified", "description": "Own 5+ different holdings"},
            4: {"name": "$10K Invested", "description": "Portfolio value ≥ $10,000"},
            5: {"name": "$50K Invested", "description": "Portfolio value ≥ $50,000"},
            6: {"name": "$100K Invested", "description": "Portfolio value ≥ $100,000"},
            7: {"name": "$250K Invested", "description": "Portfolio value ≥ $250,000"},
            8: {"name": "$500K Invested", "description": "Portfolio value ≥ $500,000"},
        }
    },
    "net_worth": {
        "name": "Net Worth",
        "icon": "Crown",
        "color": "amber",
        "tiers": {
            1: {"name": "Positive Net Worth", "description": "Net worth > $0"},
            2: {"name": "$10K Club", "description": "Net worth ≥ $10,000"},
            3: {"name": "$25K Club", "description": "Net worth ≥ $25,000"},
            4: {"name": "$50K Club", "description": "Net worth ≥ $50,000"},
            5: {"name": "Six Figures", "description": "Net worth ≥ $100,000"},
            6: {"name": "Quarter Million", "description": "Net worth ≥ $250,000"},
            7: {"name": "Half Million", "description": "Net worth ≥ $500,000"},
            8: {"name": "Millionaire", "description": "Net worth ≥ $1,000,000"},
        }
    },
    "organization": {
        "name": "Organization",
        "icon": "Tag",
        "color": "blue",
        "tiers": {
            1: {"name": "First Category", "description": "Create your first category"},
            2: {"name": "Getting Started", "description": "Create 5+ categories"},
            3: {"name": "Organized", "description": "Create 10+ categories"},
            4: {"name": "Rule Maker", "description": "Create 5+ categorization rules"},
            5: {"name": "Rule Master", "description": "Create 15+ categorization rules"},
            6: {"name": "95% Categorized", "description": "95%+ transactions categorized"},
            7: {"name": "99% Categorized", "description": "99%+ transactions categorized"},
            8: {"name": "Zero Uncategorized", "description": "100% categorized for 6 months"},
        }
    },
    "consistency": {
        "name": "Consistency",
        "icon": "Flame",
        "color": "orange",
        "tiers": {
            1: {"name": "First Login", "description": "Log in for the first time"},
            2: {"name": "Weekly User", "description": "Log in 7 consecutive days"},
            3: {"name": "Monthly Regular", "description": "Active for 4 weeks"},
            4: {"name": "Quarterly User", "description": "Active for 12 weeks"},
            5: {"name": "Half Year Streak", "description": "Active for 26 weeks"},
            6: {"name": "Annual User", "description": "Active for 52 weeks"},
            7: {"name": "Two Year Veteran", "description": "Active for 104 weeks"},
            8: {"name": "Lifetime Member", "description": "Active for 156+ weeks"},
        }
    },
    "goals": {
        "name": "Goals",
        "icon": "Star",
        "color": "yellow",
        "tiers": {
            1: {"name": "Goal Setter", "description": "Create your first savings goal"},
            2: {"name": "First Goal Complete", "description": "Complete 1 savings goal"},
            3: {"name": "Goal Achiever", "description": "Complete 3 savings goals"},
            4: {"name": "Goal Crusher", "description": "Complete 5 savings goals"},
            5: {"name": "Goal Master", "description": "Complete 10 savings goals"},
            6: {"name": "$10K Saved", "description": "Save $10K+ via goals"},
            7: {"name": "$50K Saved", "description": "Save $50K+ via goals"},
            8: {"name": "$100K Saved", "description": "Save $100K+ via goals"},
        }
    },
    "income": {
        "name": "Income",
        "icon": "DollarSign",
        "color": "green",
        "tiers": {
            1: {"name": "Income Tracked", "description": "Track income for 1 month"},
            2: {"name": "Steady Income", "description": "3 months of income data"},
            3: {"name": "Income Growth", "description": "Income increased 10% YoY"},
            4: {"name": "Strong Growth", "description": "Income increased 25% YoY"},
            5: {"name": "Multi-Stream", "description": "2+ income sources tracked"},
            6: {"name": "Diversified Income", "description": "3+ income sources"},
            7: {"name": "$100K Earner", "description": "Annual income ≥ $100K"},
            8: {"name": "$200K Earner", "description": "Annual income ≥ $200K"},
        }
    },
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_user_stats(db: Session, user: models.User):
    """Gather all stats needed for achievement checks."""
    
    # Budget categories
    bucket_count = db.query(models.BudgetBucket).filter(
        models.BudgetBucket.user_id == user.id
    ).count()
    
    # Categorization rules
    rule_count = db.query(models.CategorizationRule).filter(
        models.CategorizationRule.user_id == user.id
    ).count()
    
    # Goals
    goals = db.query(models.Goal).filter(models.Goal.user_id == user.id).all()
    goal_count = len(goals)
    
    # Completed goals (where linked account balance >= target, or sum of transactions >= target)
    completed_goals = 0
    total_goal_savings = 0.0
    for goal in goals:
        if goal.linked_account_id:
            account = db.query(models.Account).filter(models.Account.id == goal.linked_account_id).first()
            if account and account.balance >= goal.target_amount:
                completed_goals += 1
                total_goal_savings += goal.target_amount
        else:
            tx_sum = db.query(func.sum(models.Transaction.amount)).filter(
                models.Transaction.goal_id == goal.id
            ).scalar() or 0
            if tx_sum >= goal.target_amount:
                completed_goals += 1
                total_goal_savings += goal.target_amount
    
    # Investment holdings
    holdings = db.query(models.InvestmentHolding).join(models.Account).filter(
        models.Account.user_id == user.id
    ).all()
    holding_count = len(holdings)
    portfolio_value = sum(h.value or 0 for h in holdings)
    
    # Net worth (latest snapshot or calculate)
    latest_snapshot = db.query(models.NetWorthSnapshot).filter(
        models.NetWorthSnapshot.user_id == user.id
    ).order_by(models.NetWorthSnapshot.date.desc()).first()
    net_worth = latest_snapshot.net_worth if latest_snapshot else 0
    
    # Transaction stats
    total_transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id
    ).count()
    
    categorized_transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id,
        models.Transaction.bucket_id.isnot(None)
    ).count()
    
    categorization_rate = (categorized_transactions / total_transactions * 100) if total_transactions > 0 else 0
    
    # Income data - count distinct months with income
    income_months = db.query(
        func.date_trunc('month', models.Transaction.date)
    ).join(models.BudgetBucket).filter(
        models.Transaction.user_id == user.id,
        models.BudgetBucket.group == "Income"
    ).distinct().count()
    
    # Income sources (distinct income buckets with transactions)
    income_sources = db.query(models.BudgetBucket.id).join(models.Transaction).filter(
        models.Transaction.user_id == user.id,
        models.BudgetBucket.group == "Income"
    ).distinct().count()
    
    # Login streak
    login_streak = db.query(models.UserLoginStreak).filter(
        models.UserLoginStreak.user_id == user.id
    ).first()
    
    weeks_active = login_streak.total_weeks_active if login_streak else 0
    streak_days = login_streak.current_streak_days if login_streak else 0
    
    # Emergency Fund: Liquid Savings & Average Monthly Expenses
    liquid_savings = db.query(func.sum(models.Account.balance)).filter(
        models.Account.user_id == user.id,
        models.Account.account_type.in_(["Cash", "Savings", "Checking", "Bank Account"])
    ).scalar() or 0
    
    # Calculate average monthly expenses (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    total_expenses_6m = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user.id,
        models.Transaction.amount < 0,
        models.Transaction.date >= six_months_ago,
        ~models.Transaction.bucket.has(models.BudgetBucket.is_transfer == True)
    ).scalar() or 0
    
    avg_monthly_expenses = abs(total_expenses_6m) / 6 if total_expenses_6m else 0
    months_covered = liquid_savings / avg_monthly_expenses if avg_monthly_expenses > 0 else 0
    
    return {
        "bucket_count": bucket_count,
        "rule_count": rule_count,
        "goal_count": goal_count,
        "completed_goals": completed_goals,
        "total_goal_savings": total_goal_savings,
        "holding_count": holding_count,
        "portfolio_value": portfolio_value,
        "net_worth": net_worth,
        "total_transactions": total_transactions,
        "categorization_rate": categorization_rate,
        "income_months": income_months,
        "income_sources": income_sources,
        "weeks_active": weeks_active,
        "streak_days": streak_days,
        "liquid_savings": liquid_savings,
        "avg_monthly_expenses": avg_monthly_expenses,
        "months_covered": months_covered,
    }


def check_achievement_tier(category: str, tier: int, stats: dict) -> bool:
    """Check if user qualifies for a specific achievement tier."""
    
    if category == "budget":
        if tier == 1:
            return stats["bucket_count"] >= 1
        # Higher tiers require months under budget tracking (future enhancement)
        return False
    
    elif category == "savings":
        # Emergency Fund: Months of expenses covered
        thresholds = [1, 2, 3, 6, 9, 12, 18, 24]
        return stats["months_covered"] >= thresholds[tier - 1]
    
    elif category == "investments":
        if tier == 1:
            return stats["holding_count"] >= 1
        elif tier == 2:
            return stats["holding_count"] >= 3
        elif tier == 3:
            return stats["holding_count"] >= 5
        elif tier == 4:
            return stats["portfolio_value"] >= 10000
        elif tier == 5:
            return stats["portfolio_value"] >= 50000
        elif tier == 6:
            return stats["portfolio_value"] >= 100000
        elif tier == 7:
            return stats["portfolio_value"] >= 250000
        elif tier == 8:
            return stats["portfolio_value"] >= 500000
    
    elif category == "net_worth":
        thresholds = [0, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
        return stats["net_worth"] >= thresholds[tier - 1]
    
    elif category == "organization":
        if tier == 1:
            return stats["bucket_count"] >= 1
        elif tier == 2:
            return stats["bucket_count"] >= 5
        elif tier == 3:
            return stats["bucket_count"] >= 10
        elif tier == 4:
            return stats["rule_count"] >= 5
        elif tier == 5:
            return stats["rule_count"] >= 15
        elif tier == 6:
            return stats["categorization_rate"] >= 95
        elif tier == 7:
            return stats["categorization_rate"] >= 99
        elif tier == 8:
            return stats["categorization_rate"] >= 100
    
    elif category == "consistency":
        weeks_thresholds = [0, 1, 4, 12, 26, 52, 104, 156]
        return stats["weeks_active"] >= weeks_thresholds[tier - 1]
    
    elif category == "goals":
        if tier == 1:
            return stats["goal_count"] >= 1
        elif tier == 2:
            return stats["completed_goals"] >= 1
        elif tier == 3:
            return stats["completed_goals"] >= 3
        elif tier == 4:
            return stats["completed_goals"] >= 5
        elif tier == 5:
            return stats["completed_goals"] >= 10
        elif tier == 6:
            return stats["total_goal_savings"] >= 10000
        elif tier == 7:
            return stats["total_goal_savings"] >= 50000
        elif tier == 8:
            return stats["total_goal_savings"] >= 100000
    
    elif category == "income":
        if tier == 1:
            return stats["income_months"] >= 1
        elif tier == 2:
            return stats["income_months"] >= 3
        elif tier == 5:
            return stats["income_sources"] >= 2
        elif tier == 6:
            return stats["income_sources"] >= 3
        # Tiers 3, 4, 7, 8 need YoY calculation (future enhancement)
        return False
    
    return False


def calculate_progress(category: str, tier: int, stats: dict) -> float:
    """Calculate progress percentage toward next tier (0-100)."""
    
    if category == "net_worth":
        thresholds = [0, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
        if tier >= 8:
            return 100.0
        current_threshold = thresholds[tier - 1]
        next_threshold = thresholds[tier]
        if stats["net_worth"] >= next_threshold:
            return 100.0
        progress = (stats["net_worth"] - current_threshold) / (next_threshold - current_threshold) * 100
        return max(0, min(100, progress))
    
    elif category == "savings":
        # Emergency Fund: Months of expenses covered
        thresholds = [0, 1, 2, 3, 6, 9, 12, 18, 24]
        if tier >= 8:
            return 100.0
        current_threshold = thresholds[tier - 1] if tier > 1 else 0
        next_threshold = thresholds[tier]
        if stats["months_covered"] >= next_threshold:
            return 100.0
        if next_threshold == current_threshold:
            return 100.0
        progress = (stats["months_covered"] - current_threshold) / (next_threshold - current_threshold) * 100
        return max(0, min(100, progress))
    
    elif category == "investments":
        thresholds = [0, 1, 3, 5, 10000, 50000, 100000, 250000, 500000]
        if tier >= 8:
            return 100.0
        if tier <= 3:
            # Holdings count
            current = thresholds[tier - 1]
            next_val = thresholds[tier]
            progress = (stats["holding_count"] - current) / (next_val - current) * 100
        else:
            # Portfolio value
            current = thresholds[tier]
            next_val = thresholds[tier + 1]
            progress = (stats["portfolio_value"] - current) / (next_val - current) * 100
        return max(0, min(100, progress))
    
    elif category == "organization":
        if tier == 1:
            return 100.0 if stats["bucket_count"] >= 1 else 0
        elif tier <= 3:
            targets = [0, 1, 5, 10]
            progress = stats["bucket_count"] / targets[tier] * 100
        elif tier <= 5:
            targets = [0, 0, 0, 0, 5, 15]
            progress = stats["rule_count"] / targets[tier] * 100
        else:
            targets = [0, 0, 0, 0, 0, 0, 95, 99, 100]
            progress = stats["categorization_rate"] / targets[tier] * 100
        return max(0, min(100, progress))
    
    elif category == "goals":
        if tier == 1:
            return 100.0 if stats["goal_count"] >= 1 else 0
        elif tier <= 5:
            targets = [0, 1, 1, 3, 5, 10]
            progress = stats["completed_goals"] / targets[tier] * 100
        else:
            targets = [0, 0, 0, 0, 0, 0, 10000, 50000, 100000]
            progress = stats["total_goal_savings"] / targets[tier] * 100
        return max(0, min(100, progress))
    
    return 0.0


# ============================================
# API ENDPOINTS
# ============================================

@router.get("")
def get_achievements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all achievements with user progress and unlock status.
    """
    # Get user's earned achievements
    earned = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).all()
    
    earned_map = {(a.category, a.tier): a for a in earned}
    
    # Get user stats for progress calculation
    stats = get_user_stats(db, current_user)
    
    # Build response
    categories = []
    total_earned = 0
    total_possible = 0
    
    for cat_id, cat_def in ACHIEVEMENTS.items():
        # Find highest earned tier for this category
        highest_tier = 0
        for tier in range(1, 9):
            if (cat_id, tier) in earned_map:
                highest_tier = tier
        
        # Check if user qualifies for next tier
        next_tier = highest_tier + 1 if highest_tier < 8 else None
        if next_tier and check_achievement_tier(cat_id, next_tier, stats):
            # User earned new tier - save it!
            new_achievement = models.UserAchievement(
                user_id=current_user.id,
                category=cat_id,
                tier=next_tier,
                achievement_id=f"{cat_id}_{TIERS[next_tier]['name'].lower()}"
            )
            db.add(new_achievement)
            highest_tier = next_tier
        
        # Calculate progress toward next tier
        progress = 0.0
        if highest_tier < 8:
            progress = calculate_progress(cat_id, highest_tier + 1, stats)
        
        # Build tier list
        tiers = []
        for tier_num in range(1, 9):
            tier_def = cat_def["tiers"][tier_num]
            is_earned = tier_num <= highest_tier
            
            tiers.append({
                "tier": tier_num,
                "name": tier_def["name"],
                "description": tier_def["description"],
                "tier_name": TIERS[tier_num]["name"],
                "tier_color": TIERS[tier_num]["color"],
                "tier_icon": TIERS[tier_num]["icon"],
                "is_earned": is_earned,
                "unlocked_at": earned_map[(cat_id, tier_num)].unlocked_at if (cat_id, tier_num) in earned_map else None
            })
            
            total_possible += 1
            if is_earned:
                total_earned += 1
        
        categories.append({
            "id": cat_id,
            "name": cat_def["name"],
            "icon": cat_def["icon"],
            "color": cat_def["color"],
            "current_tier": highest_tier,
            "max_tier": 8,
            "progress_to_next": round(progress, 1),
            "tiers": tiers
        })
    
    db.commit()
    
    return {
        "categories": categories,
        "summary": {
            "total_earned": total_earned,
            "total_possible": total_possible,
            "completion_rate": round(total_earned / total_possible * 100, 1) if total_possible > 0 else 0
        }
    }


@router.get("/summary")
def get_achievements_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Quick summary for dashboard widget.
    """
    earned = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).all()
    
    # Get latest unlocks
    latest = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).order_by(models.UserAchievement.unlocked_at.desc()).limit(3).all()
    
    # Category progress
    category_progress = {}
    for cat_id in ACHIEVEMENTS.keys():
        cat_earned = [a for a in earned if a.category == cat_id]
        highest = max([a.tier for a in cat_earned], default=0)
        category_progress[cat_id] = {
            "current_tier": highest,
            "tier_name": TIERS[highest]["name"] if highest > 0 else None,
            "tier_icon": TIERS[highest]["icon"] if highest > 0 else "🔒"
        }
    
    return {
        "total_earned": len(earned),
        "total_possible": 8 * len(ACHIEVEMENTS),  # 8 tiers * 8 categories
        "latest_unlocks": [
            {
                "category": a.category,
                "tier": a.tier,
                "achievement_id": a.achievement_id,
                "name": ACHIEVEMENTS[a.category]["tiers"][a.tier]["name"],
                "tier_icon": TIERS[a.tier]["icon"],
                "unlocked_at": a.unlocked_at.isoformat() if a.unlocked_at else None
            }
            for a in latest
        ],
        "category_progress": category_progress
    }


@router.post("/check")
def check_achievements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Trigger achievement check and unlock any newly earned achievements.
    Returns list of newly unlocked achievements.
    """
    stats = get_user_stats(db, current_user)
    
    earned = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).all()
    
    earned_set = {(a.category, a.tier) for a in earned}
    newly_unlocked = []
    
    for cat_id in ACHIEVEMENTS.keys():
        for tier in range(1, 9):
            if (cat_id, tier) in earned_set:
                continue  # Already earned
            
            # Check if previous tier is earned (must earn in order)
            if tier > 1 and (cat_id, tier - 1) not in earned_set:
                break  # Can't skip tiers
            
            if check_achievement_tier(cat_id, tier, stats):
                new_achievement = models.UserAchievement(
                    user_id=current_user.id,
                    category=cat_id,
                    tier=tier,
                    achievement_id=f"{cat_id}_{TIERS[tier]['name'].lower()}"
                )
                db.add(new_achievement)
                earned_set.add((cat_id, tier))
                
                newly_unlocked.append({
                    "category": cat_id,
                    "category_name": ACHIEVEMENTS[cat_id]["name"],
                    "tier": tier,
                    "tier_name": TIERS[tier]["name"],
                    "tier_icon": TIERS[tier]["icon"],
                    "achievement_name": ACHIEVEMENTS[cat_id]["tiers"][tier]["name"],
                    "description": ACHIEVEMENTS[cat_id]["tiers"][tier]["description"]
                })
            else:
                break  # Can't earn higher tiers if current not met
    
    db.commit()
    
    return {
        "newly_unlocked": newly_unlocked,
        "total_new": len(newly_unlocked)
    }


@router.post("/record-login")
def record_login(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Record user login for consistency tracking.
    Should be called on each login.
    """
    today = date.today()
    
    streak = db.query(models.UserLoginStreak).filter(
        models.UserLoginStreak.user_id == current_user.id
    ).first()
    
    if not streak:
        streak = models.UserLoginStreak(
            user_id=current_user.id,
            current_streak_days=1,
            longest_streak_days=1,
            total_weeks_active=1,
            last_login_date=today
        )
        db.add(streak)
    else:
        if streak.last_login_date:
            days_since = (today - streak.last_login_date).days
            
            if days_since == 0:
                pass  # Same day, no update
            elif days_since == 1:
                # Consecutive day
                streak.current_streak_days += 1
                streak.longest_streak_days = max(streak.longest_streak_days, streak.current_streak_days)
            else:
                # Streak broken
                streak.current_streak_days = 1
            
            # Update weeks active (roughly)
            if days_since <= 7:
                # Still within the same week-ish
                pass
            else:
                streak.total_weeks_active += 1
        
        streak.last_login_date = today
    
    db.commit()
    
    return {
        "current_streak": streak.current_streak_days,
        "longest_streak": streak.longest_streak_days,
        "weeks_active": streak.total_weeks_active
    }
