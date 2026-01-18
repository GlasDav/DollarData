from datetime import datetime
from typing import Optional, Dict, Any
import logging
import os
import httpx

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import get_db
from . import models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Legacy Secret for internal signing if needed (not for Supabase)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Global Cache for JWKS
_jwks_cache: Dict[str, Any] = {}

async def get_supabase_jwks(supabase_url: str) -> Dict[str, Any]:
    """Fetch and cache JWKS from Supabase."""
    global _jwks_cache
    
    # Simple caching strategy: if populated, return it. 
    # In production, might want TTL, but keys rotate rarely.
    if _jwks_cache:
        return _jwks_cache

    # Try the standard .well-known endpoint first
    jwks_url = f"{supabase_url.rstrip('/')}/.well-known/jwks.json"
    
    # Add API Key to headers just in case (though .well-known is usually public)
    headers = {}
    api_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") # fallback
    if api_key:
        headers["apikey"] = api_key
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, headers=headers)
            if response.status_code == 404:
                # Fallback to the other common Supabase path
                jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/jwks"
                response = await client.get(jwks_url, headers=headers)
            
            response.raise_for_status()
            _jwks_cache = response.json()
            return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS from {jwks_url}: {e}")
        # Clear cache if failed potentially?
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify authentication keys"
        )

def create_default_user_setup(user: models.User, db: Session):
    """Create default accounts and buckets for a new user with hierarchical categories.
    
    Optimized to use batched INSERTs to reduce database roundtrips.
    Uses raw SQL with explicit UUID casting for PostgreSQL compatibility.
    """
    from sqlalchemy import text
    
    user_id = str(user.id)  # Ensure it's a string
    logger.info(f"Starting default setup for user {user_id}...")
    
    # 1. Batch Create Default Accounts
    # --------------------------------
    logger.info("Batch creating default accounts...")
    
    # Using raw SQL values batching
    db.execute(text("""
        INSERT INTO accounts (user_id, name, type, category, balance, is_active)
        VALUES 
            (CAST(:user_id AS uuid), 'Checking Account', 'Asset', 'Cash', 0.0, true),
            (CAST(:user_id AS uuid), 'Savings Account', 'Asset', 'Cash', 0.0, true),
            (CAST(:user_id AS uuid), 'Credit Card', 'Liability', 'Credit Card', 0.0, true)
    """), {"user_id": user_id})
    
    # 2. Batch Create Parent Buckets
    # ------------------------------
    logger.info("Batch creating parent buckets...")
    
    # Define parents and their config
    DEFAULT_CATEGORIES = {
        "Income": {"icon": "TrendingUp", "group": "Income", "display_order": 0},
        "Household Expenses": {"icon": "Home", "group": "Non-Discretionary", "display_order": 1},
        "Vehicle": {"icon": "Car", "group": "Non-Discretionary", "display_order": 2},
        "Food": {"icon": "Utensils", "group": "Discretionary", "display_order": 3},
        "Lifestyle": {"icon": "Heart", "group": "Discretionary", "display_order": 4},
        "Health & Wellness": {"icon": "HeartPulse", "group": "Non-Discretionary", "display_order": 5},
        "Kids": {"icon": "Baby", "group": "Discretionary", "display_order": 6},
        "Rollover/Non-Monthly": {"icon": "Calendar", "group": "Discretionary", "display_order": 7},
        "Financial": {"icon": "Landmark", "group": "Non-Discretionary", "display_order": 8},
        "Other": {"icon": "MoreHorizontal", "group": "Discretionary", "display_order": 9},
    }
    
    # Construct VALUES part dynamically to ensure order matches our dictionary if we iterated, 
    # but a static big query is cleaner if we hardcode or just loop construction.
    # Let's use a parameterized execute with multiple sets of params is not supported by text() usually in this way 
    # without executemany, but we want one roundtrip.
    # We will construct a single INSERT statement with multiple VALUES.
    
    parent_insert_values = []
    parent_params = {"user_id": user_id}
    
    for i, (name, config) in enumerate(DEFAULT_CATEGORIES.items()):
        # Parameter keys must be unique
        p_name = f"p_name_{i}"
        p_icon = f"p_icon_{i}"
        p_group = f"p_group_{i}"
        p_order = f"p_order_{i}"
        
        parent_insert_values.append(f"(CAST(:user_id AS uuid), :{p_name}, :{p_icon}, :{p_group}, :{p_order})")
        
        parent_params[p_name] = name
        parent_params[p_icon] = config["icon"]
        parent_params[p_group] = config["group"]
        parent_params[p_order] = config["display_order"]

    parent_sql = f"""
        INSERT INTO budget_buckets (user_id, name, icon_name, "group", display_order)
        VALUES {', '.join(parent_insert_values)}
        RETURNING id, name
    """
    
    result = db.execute(text(parent_sql), parent_params)
    parents_map = {row[1]: row[0] for row in result.fetchall()}
    
    # 3. Batch Create Child Buckets
    # -----------------------------
    logger.info("Batch creating child buckets...")
    
    # Define children structure
    CHILDREN_definitions = {
        "Income": [
            {"name": "Salaries", "icon": "Briefcase"},
            {"name": "Interest", "icon": "TrendingUp"},
            {"name": "Business", "icon": "Building"},
            {"name": "Other Income", "icon": "DollarSign"},
        ],
        "Household Expenses": [
            {"name": "Gas & Electricity", "icon": "Zap"},
            {"name": "Water", "icon": "Droplet"},
            {"name": "Internet", "icon": "Wifi"},
            {"name": "Mobile Phone", "icon": "Smartphone"},
            {"name": "Mortgage/Rent", "icon": "Home"},
            {"name": "Strata Levies", "icon": "Building"},
            {"name": "Council Rates", "icon": "Landmark"},
            {"name": "Subscriptions", "icon": "CreditCard"},
            {"name": "Maintenance", "icon": "Wrench"},
            {"name": "Household General", "icon": "Home"},
        ],
        "Vehicle": [
            {"name": "Petrol", "icon": "Fuel"},
            {"name": "Insurance & Registration", "icon": "Shield"},
            {"name": "Vehicle Maintenance", "icon": "Settings"},
        ],
        "Food": [
            {"name": "Groceries", "icon": "ShoppingCart"},
            {"name": "Dining Out", "icon": "Utensils"},
            {"name": "Coffee", "icon": "Coffee"},
            {"name": "Snacks", "icon": "Cookie"},
        ],
        "Lifestyle": [
            {"name": "Personal", "icon": "User"},
            {"name": "Homewares", "icon": "Sofa"},
            {"name": "Beauty", "icon": "Sparkles"},
            {"name": "Health & Fitness", "icon": "Dumbbell"},
            {"name": "Clothing", "icon": "Shirt"},
            {"name": "Leisure", "icon": "Film"},
            {"name": "Dates", "icon": "Heart"},
            {"name": "Gifts", "icon": "Gift"},
            {"name": "Parking & Tolls", "icon": "ParkingCircle"},
            {"name": "Public Transport", "icon": "Train"},
            {"name": "Taxi & Rideshare", "icon": "Car"},
        ],
        "Health & Wellness": [
            {"name": "Medical", "icon": "Stethoscope"},
            {"name": "Dental", "icon": "Smile"},
            {"name": "Pharmacy", "icon": "Pill"},
            {"name": "Fitness", "icon": "Dumbbell"},
        ],
        "Kids": [
            {"name": "Childcare", "icon": "Baby"},
            {"name": "Education", "icon": "GraduationCap"},
            {"name": "Kids Expenses", "icon": "ShoppingBag"},
            {"name": "Activities", "icon": "Gamepad"},
        ],
        "Rollover/Non-Monthly": [
            {"name": "Donations", "icon": "HandHeart"},
            {"name": "Renovations", "icon": "Hammer"},
            {"name": "Travel", "icon": "Plane"},
            {"name": "Major Purchases", "icon": "ShoppingBag"},
        ],
        "Financial": [
            {"name": "Cash & ATM Fees", "icon": "Banknote"},
            {"name": "Financial Fees", "icon": "Building2"},
            {"name": "Accounting", "icon": "Calculator"},
        ],
        "Other": [
            {"name": "Work Expenses", "icon": "Briefcase"},
            {"name": "Business Expenses", "icon": "Building"},
            {"name": "Miscellaneous", "icon": "MoreHorizontal"},
            {"name": "Uncategorised", "icon": "HelpCircle"},
        ],
    }
    
    child_insert_values = []
    child_params = {"user_id": user_id}
    child_param_idx = 0
    
    for parent_name, children in CHILDREN_definitions.items():
        parent_id = parents_map.get(parent_name)
        parent_group = DEFAULT_CATEGORIES[parent_name]["group"]
        
        if not parent_id:
            logger.error(f"Parent bucket '{parent_name}' not found in map, skipping children.")
            continue
            
        for i, child in enumerate(children):
            c_name = f"c_name_{child_param_idx}"
            c_icon = f"c_icon_{child_param_idx}"
            c_group = f"c_group_{child_param_idx}"
            c_pid = f"c_pid_{child_param_idx}"
            c_order = f"c_order_{child_param_idx}"
            
            child_insert_values.append(f"(CAST(:user_id AS uuid), :{c_name}, :{c_icon}, :{c_group}, :{c_pid}, :{c_order})")
            
            child_params[c_name] = child["name"]
            child_params[c_icon] = child.get("icon", "Wallet")
            child_params[c_group] = parent_group
            child_params[c_pid] = parent_id
            child_params[c_order] = i
            
            child_param_idx += 1

    if child_insert_values:
        child_sql = f"""
            INSERT INTO budget_buckets (user_id, name, icon_name, "group", parent_id, display_order)
            VALUES {', '.join(child_insert_values)}
        """
        db.execute(text(child_sql), child_params)

    # 4. Batch Create Special Buckets
    # -------------------------------
    logger.info("Batch creating special buckets...")
    
    # We continue display_order from where parents left off (len(DEFAULT_CATEGORIES))
    special_start_order = len(DEFAULT_CATEGORIES)
    
    db.execute(text("""
        INSERT INTO budget_buckets (user_id, name, icon_name, "group", is_transfer, is_investment, is_one_off, display_order)
        VALUES 
            (CAST(:user_id AS uuid), 'Transfers', 'ArrowLeftRight', 'Non-Discretionary', true, false, false, :order_1),
            (CAST(:user_id AS uuid), 'Investments', 'TrendingUp', 'Non-Discretionary', false, true, false, :order_2),
            (CAST(:user_id AS uuid), 'One Off', 'Zap', 'Non-Discretionary', false, false, true, :order_3),
            (CAST(:user_id AS uuid), 'Reimbursable', 'ReceiptText', 'Non-Discretionary', false, false, false, :order_4)
    """), {
        "user_id": user_id,
        "order_1": special_start_order,
        "order_2": special_start_order + 1,
        "order_3": special_start_order + 2,
        "order_4": special_start_order + 3
    })
    
    db.commit()
    logger.info(f"Created default configuration for user {user.email}")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("SECRET_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_JWT_KEY = os.getenv("SUPABASE_JWT_KEY")
    
    try:
        # Inspect Header to determine Algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        kid = header.get("kid")
        
        logger.info(f"JWT token algorithm: {alg}, kid: {kid}")
        
        payload = None
        
        # Strategy 1: HS256 (Symmetric Secret)
        if SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token, 
                    SUPABASE_JWT_SECRET, 
                    algorithms=["HS256"], 
                    audience="authenticated"
                )
                logger.info("JWT verified successfully with HS256")
                # Return immediately if successful
            except JWTError as hs256_error:
                # Only log error if token claimed to be HS256
                if alg == "HS256":
                     logger.error(f"HS256 verification failed: {hs256_error}")
                     raise credentials_exception
                # Otherwise, just debug log and fall through to Asymmetric check
                logger.debug(f"HS256 check failed (expected for ES256/RS256): {hs256_error}")

        if payload: 
             pass # Already verified

        # Strategy 2: Static JWK Check (ES256/RS256)
        elif SUPABASE_JWT_KEY and alg in ["RS256", "ES256"]:
            logger.info("Attempting verification with statically configured SUPABASE_JWT_KEY")
            try:
                # Parse the JSON key
                import json
                jwk_data = json.loads(SUPABASE_JWT_KEY)
                
                # Check if kid matches (if present in both)
                if kid and jwk_data.get("kid") and kid != jwk_data.get("kid"):
                     logger.warning(f"Key ID mismatch: Token={kid}, Config={jwk_data.get('kid')}")
                
                 # Python-Jose can accept the JWK dict directly
                payload = jwt.decode(
                    token, 
                    jwk_data, 
                    algorithms=[alg], 
                    audience="authenticated"
                )
                logger.info(f"JWT verified successfully with {alg} using static key")
            except Exception as e:
                logger.error(f"Static key verification failed: {e}")
                # Don't raise yet, try JWKS fallback if configured? 
                # Actually, if static key is provided, we probably rely on it.
                # But let's allow fallback just in case.
                pass

        # Strategy 3: Dynamic JWKS Fetch (Fallback)
        if not payload and alg in ["RS256", "ES256"] and SUPABASE_URL:
             logger.info(f"Attempting dynamic JWKS fetch for {alg} verification...")
             try:
                jwks = await get_supabase_jwks(SUPABASE_URL)
                payload = jwt.decode(
                    token, 
                    jwks, 
                    algorithms=["RS256", "ES256"], 
                    audience="authenticated",
                )
                logger.info(f"JWT verified successfully with {alg} via JWKS")
             except Exception as jwks_error:
                logger.error(f"JWKS verification failed: {jwks_error}")
                raise credentials_exception

        if not payload:
            logger.error(f"All verification strategies failed for alg={alg}")
            raise credentials_exception
            
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if not user_id:
             raise credentials_exception

    except JWTError as e:
        logger.error(f"JWT Verification failed: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Using JWT auth failed unexpected: {e}")
        raise credentials_exception

    # Query User (from public.profiles)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user is None:
        logger.info(f"User {user_id} ({email}) authenticated but not found in profiles. Provisioning JIT...")
        
        # JIT Provisioning
        # 1. Create Profile
        new_user = models.User(
            id=user_id,
            email=email,
            name="User" # Default name
            # currency_symbol defaults to AUD in model
        )
        db.add(new_user)
        try:
            db.commit()
            db.refresh(new_user)
            
            # 2. Setup Default Data
            create_default_user_setup(new_user, db)
            
            return new_user
        except Exception as e:
            logger.error(f"Failed to provision user {user_id}: {e}")
            db.rollback()
            raise credentials_exception
    
    # Check if user exists but has no defaults (created by Supabase trigger without setup)
    bucket_count = db.query(models.BudgetBucket).filter(
        models.BudgetBucket.user_id == user.id
    ).count()
    
    if bucket_count == 0:
        logger.info(f"User {user.email} exists but has no budget buckets. Applying default setup...")
        try:
            create_default_user_setup(user, db)
            logger.info(f"Successfully applied default setup for user {user.email}")
        except Exception as e:
            logger.error(f"Failed to apply defaults for user {user.id}: {e}")
            db.rollback()
            # Don't raise - user can still use the app, just without defaults
    
    return user
