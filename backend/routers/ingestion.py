import logging
import shutil
import os
import tempfile
import hashlib
import uuid
import threading
import time
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db, SessionLocal
from .. import models, schemas, auth
from ..services.pdf_parser import parse_pdf
from ..services.categorizer import Categorizer
from ..services.csv_service import parse_preview, process_csv
from ..services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# File upload limits
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024  # 10MB

router = APIRouter(
    prefix="/ingest",
    tags=["ingestion"],
)

categorizer = Categorizer()

# ============== JOB STORE FOR BACKGROUND PROCESSING ==============
# Job tracking moved to database
# _job_store removed
_job_lock = threading.Lock()

def create_job(db: Session, user_id: str, total_transactions: int) -> str:
    """Create a new processing job in DB and return its ID."""
    job_id = str(uuid.uuid4())
    job = models.Job(
        id=job_id,
        user_id=str(user_id),
        status='processing',
        progress=0,
        total=total_transactions,
        message='Starting...',
        duplicate_count=0
    )
    db.add(job)
    db.commit()
    return job_id

def update_job_progress(db: Session, job_id: str, progress: int, message: str = None):
    """Update job progress."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if job:
        job.progress = progress
        if message:
            job.message = message
        db.commit()

def update_job_total(db: Session, job_id: str, total: int):
    """Update job total when actual count is known."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if job:
        job.total = total
        db.commit()

def complete_job(db: Session, job_id: str, result: list):
    """Mark job as complete with results."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if job:
        job.status = 'complete'
        job.progress = job.total
        job.message = 'Complete'
        job.result = result # JSONB will handle list/dict
        db.commit()

def fail_job(db: Session, job_id: str, error_message: str):
    """Mark job as failed."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if job:
        job.status = 'failed'
        job.error = error_message
        db.commit()

def get_job_status(db: Session, user_id: str, job_id: str) -> dict:
    """Get current job status from DB."""
    job = db.query(models.Job).filter(
        models.Job.id == job_id, 
        models.Job.user_id == str(user_id)
    ).first()
    
    if job:
        return {
            'job_id': job.id,
            'status': job.status,
            'progress': job.progress,
            'total': job.total,
            'message': job.message,
            'error': job.error,
            'duplicate_count': 0, # Simplify or add col to model if needed
            'result': job.result if job.status == 'complete' else None
        }
    return None

def cleanup_old_jobs(db: Session, user_id: str, max_age_hours: int = 1):
    """Remove jobs older than max_age_hours."""
    # Optional implementation using DB query
    pass 

# ============================================================


def generate_transaction_hash(user_id: int, date, raw_description: str, amount: float) -> str:
    """
    Generate a unique fingerprint for duplicate detection.
    Uses: user_id + date + raw_description + absolute amount
    """
    date_str = date.isoformat() if hasattr(date, 'isoformat') else str(date)
    key = f"{user_id}|{date_str}|{raw_description.lower().strip()}|{abs(round(amount, 2))}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


async def validate_file_size(file: UploadFile) -> bytes:
    """Read and validate file size. Returns file content if valid."""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB."
        )
    return content

def process_transactions_preview(extracted_data, user, db, spender, skip_duplicates=True):
    """
    Categorize transactions for preview WITHOUT saving to database.
    Uses a multi-stage approach:
    1. Duplicate detection (if skip_duplicates=True)
    2. User's smart rules (highest priority)
    3. Bucket tags/keywords
    4. Global keyword matching
    5. AI prediction for remaining uncategorized
    
    Returns: (preview_transactions, duplicate_count)
    Preview transactions are dicts with temp IDs for frontend use.
    """
    from ..services.ai_categorizer import get_ai_categorizer
    
    # === DUPLICATE DETECTION ===
    duplicate_count = 0
    non_duplicate_data = []
    
    if skip_duplicates and extracted_data:
        # Generate hashes for incoming transactions
        incoming_hashes = {}
        for i, data in enumerate(extracted_data):
            txn_hash = generate_transaction_hash(
                user.id, 
                data["date"], 
                data["description"],  # raw description
                data["amount"]
            )
            incoming_hashes[i] = txn_hash
        
        # Fetch existing hashes for this user
        existing_hashes = set(
            h[0] for h in db.query(models.Transaction.transaction_hash)
            .filter(
                models.Transaction.user_id == user.id,
                models.Transaction.transaction_hash.isnot(None)
            ).all()
        )
        
        # Filter out duplicates
        for i, data in enumerate(extracted_data):
            if incoming_hashes[i] not in existing_hashes:
                non_duplicate_data.append((data, incoming_hashes[i]))
            else:
                duplicate_count += 1
        
        logger.info(f"Duplicate detection: {duplicate_count} duplicates skipped, {len(non_duplicate_data)} new transactions")
    else:
        # No duplicate checking - process all
        for data in extracted_data:
            txn_hash = generate_transaction_hash(user.id, data["date"], data["description"], data["amount"])
            non_duplicate_data.append((data, txn_hash))
    
    if not non_duplicate_data:
        return [], duplicate_count
    
    # Fetch Buckets for Mapping (no longer loading tags)
    buckets = db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user.id).all()
    bucket_by_id = {b.id: b for b in buckets}
    
    # Build Bucket Map (Name -> ID)
    bucket_map = {b.name.lower(): b.id for b in buckets}
    bucket_names = [b.name for b in buckets]  # Keep original casing for AI
            
    # Fetch Smart Rules (Prioritized) - this is now the primary categorization method
    from sqlalchemy import case, or_
    
    # Rules with min/max filters ALWAYS take precedence (specificity first, then drag-drop priority)
    specificity_score = case(
        (or_(models.CategorizationRule.min_amount.isnot(None), models.CategorizationRule.max_amount.isnot(None)), 1),
        else_=0
    )
    
    smart_rules = db.query(models.CategorizationRule).filter(models.CategorizationRule.user_id == user.id).order_by(
        specificity_score.desc(),  # Filtered rules always take precedence
        models.CategorizationRule.priority.desc(),
        models.CategorizationRule.id.desc()
    ).all()

    # First pass: Apply rule-based categorization
    pending_transactions = []  # Store (index, data, clean_desc) for AI fallback
    categorization_results = []  # Store (bucket_id, confidence, is_verified) per transaction
    
    for i, (data, txn_hash) in enumerate(non_duplicate_data):
        # Pre-clean description for better matching
        clean_desc = categorizer.clean_description(data["description"])
        
        bucket_id = None
        confidence = 0.0
        is_verified = False
        
        # A. Smart Rules (Highest Priority)
        matched_rule = categorizer.apply_rules(clean_desc, smart_rules, amount=data["amount"])
        tags = None
        if matched_rule:
            bucket_id = matched_rule.bucket_id
            confidence = 1.0
            # Explicit rule match = Verified, UNLESS marked for review
            is_verified = not matched_rule.mark_for_review
            tags = matched_rule.apply_tags
        else:
            # B. Best Guess (Global Keywords)
            guessed_bucket_id, guess_conf = categorizer.guess_category(clean_desc, bucket_map)
            if guessed_bucket_id:
                bucket_id = guessed_bucket_id
                confidence = guess_conf
        
        # Track result (include hash for later)
        categorization_results.append({
            'bucket_id': bucket_id,
            'confidence': confidence,
            'is_verified': is_verified,
            'clean_desc': clean_desc,
            'txn_hash': txn_hash,
            'tags': tags,
            'raw_data': data
        })
        
        # If still uncategorized, queue for AI
        if bucket_id is None:
            pending_transactions.append({
                'index': i,
                'description': clean_desc,
                'raw_description': data["description"],
                'amount': data["amount"]
            })
    
    # Second pass: AI categorization for uncategorized transactions
    if pending_transactions and bucket_names:
        ai_categorizer = get_ai_categorizer()
        try:
            ai_predictions = ai_categorizer.categorize_batch_sync(pending_transactions, bucket_names)
            
            # Apply AI predictions
            for txn_data in pending_transactions:
                idx = txn_data['index']
                local_idx = pending_transactions.index(txn_data)
                
                if local_idx in ai_predictions:
                    predicted_bucket, ai_confidence = ai_predictions[local_idx]
                    # Match to bucket ID
                    matched_bucket_id = bucket_map.get(predicted_bucket.lower())
                    if matched_bucket_id:
                        categorization_results[idx]['bucket_id'] = matched_bucket_id
                        categorization_results[idx]['confidence'] = ai_confidence
                        # AI predictions should NOT be auto-verified - user should review
                        categorization_results[idx]['is_verified'] = False
                        
            logger.info(f"AI categorized {len(ai_predictions)}/{len(pending_transactions)} transactions")
        except Exception as e:
            logger.warning(f"AI categorization failed, falling back to uncategorized: {e}")
    
    # Build preview transactions (NOT saved to DB)
    # Use negative temp IDs to distinguish from real DB IDs
    preview_transactions = []
    for i, result in enumerate(categorization_results):
        data = result['raw_data']
        bucket = bucket_by_id.get(result['bucket_id']) if result['bucket_id'] else None
        
        preview_txn = {
            'id': -(i + 1),  # Negative temp ID
            'date': data["date"].isoformat() if hasattr(data["date"], 'isoformat') else str(data["date"]),
            'description': result['clean_desc'],
            'raw_description': data["description"],
            'amount': data["amount"],
            'bucket_id': result['bucket_id'],
            'bucket': {'id': bucket.id, 'name': bucket.name, 'icon_name': bucket.icon_name} if bucket else None,
            'category_confidence': result['confidence'],
            'category_confidence': result['confidence'],
            'is_verified': result['is_verified'],
            'spender': spender,
            'tags': result.get('tags'),
            'transaction_hash': result['txn_hash']
        }
        preview_transactions.append(preview_txn)
    
    return preview_transactions, duplicate_count


def process_transactions_preview_with_progress(
    extracted_data, user, db, spender, skip_duplicates=True, progress_callback=None
):
    """
    Same as process_transactions_preview but with progress callback for async jobs.
    progress_callback(progress: int, message: str) is called periodically.
    """
    from ..services.ai_categorizer import get_ai_categorizer
    
    def report_progress(progress: int, message: str):
        if progress_callback:
            progress_callback(progress, message)
    
    # === DUPLICATE DETECTION ===
    duplicate_count = 0
    non_duplicate_data = []
    
    report_progress(0, "Checking for duplicates...")
    
    if skip_duplicates and extracted_data:
        incoming_hashes = {}
        for i, data in enumerate(extracted_data):
            txn_hash = generate_transaction_hash(
                user.id, data["date"], data["description"], data["amount"]
            )
            incoming_hashes[i] = txn_hash
        
        existing_hashes = set(
            h[0] for h in db.query(models.Transaction.transaction_hash)
            .filter(
                models.Transaction.user_id == user.id,
                models.Transaction.transaction_hash.isnot(None)
            ).all()
        )
        
        for i, data in enumerate(extracted_data):
            if incoming_hashes[i] not in existing_hashes:
                non_duplicate_data.append((data, incoming_hashes[i]))
            else:
                duplicate_count += 1
    else:
        for data in extracted_data:
            txn_hash = generate_transaction_hash(user.id, data["date"], data["description"], data["amount"])
            non_duplicate_data.append((data, txn_hash))
    
    total = len(non_duplicate_data)
    report_progress(0, f"Found {total} new transactions ({duplicate_count} duplicates skipped)")
    
    if not non_duplicate_data:
        return [], duplicate_count
    
    # Fetch Buckets
    buckets = db.query(models.BudgetBucket).filter(models.BudgetBucket.user_id == user.id).all()
    bucket_by_id = {b.id: b for b in buckets}
    bucket_map = {b.name.lower(): b.id for b in buckets}
    bucket_names = [b.name for b in buckets]
    
    # Fetch Smart Rules - filtered rules always take precedence
    from sqlalchemy import case, or_
    specificity_score = case(
        (or_(models.CategorizationRule.min_amount.isnot(None), models.CategorizationRule.max_amount.isnot(None)), 1),
        else_=0
    )
    smart_rules = db.query(models.CategorizationRule).filter(
        models.CategorizationRule.user_id == user.id
    ).order_by(
        specificity_score.desc(),  # Filtered rules always take precedence
        models.CategorizationRule.priority.desc(),
        models.CategorizationRule.id.desc()
    ).all()
    
    report_progress(0, "Applying Smart Rules...")
    
    # First pass: Rule-based categorization
    pending_transactions = []
    categorization_results = []
    
    for i, (data, txn_hash) in enumerate(non_duplicate_data):
        clean_desc = categorizer.clean_description(data["description"])
        bucket_id = None
        confidence = 0.0
        is_verified = False
        
        # Smart Rules first
        matched_rule = categorizer.apply_rules(clean_desc, smart_rules, amount=data["amount"])
        tags = None
        if matched_rule:
            bucket_id = matched_rule.bucket_id
            confidence = 1.0
            is_verified = not matched_rule.mark_for_review
            tags = matched_rule.apply_tags
        else:
            # Global Keywords
            guessed_bucket_id, guess_conf = categorizer.guess_category(clean_desc, bucket_map)
            if guessed_bucket_id:
                bucket_id = guessed_bucket_id
                confidence = guess_conf
        
        categorization_results.append({
            'bucket_id': bucket_id,
            'confidence': confidence,
            'is_verified': is_verified,
            'clean_desc': clean_desc,
            'txn_hash': txn_hash,
            'tags': tags,
            'raw_data': data
        })
        
        if bucket_id is None:
            pending_transactions.append({
                'index': i,
                'description': clean_desc,
                'raw_description': data["description"],
                'amount': data["amount"]
            })
        
        # Progress update every 50 transactions
        if (i + 1) % 50 == 0 or i == total - 1:
            categorized = i + 1 - len(pending_transactions)
            report_progress(i + 1, f"Applying rules: {categorized}/{i+1} auto-categorized")
    
    # AI categorization for uncategorized
    if pending_transactions and bucket_names:
        categorized_by_rules = total - len(pending_transactions)
        ai_pending_count = len(pending_transactions)
        
        def ai_progress(processed, ai_total, batch_num, num_batches):
            report_progress(total, f"AI: batch {batch_num}/{num_batches} ({processed}/{ai_total} processed)")
        
        report_progress(total, f"Rules done ({categorized_by_rules} matched). AI starting on {ai_pending_count}...")
        ai_categorizer = get_ai_categorizer()
        try:
            ai_predictions = ai_categorizer.categorize_batch_sync(
                pending_transactions, 
                bucket_names,
                progress_callback=ai_progress
            )
            
            for txn_data in pending_transactions:
                idx = txn_data['index']
                local_idx = pending_transactions.index(txn_data)
                if local_idx in ai_predictions:
                    predicted_bucket, ai_confidence = ai_predictions[local_idx]
                    matched_bucket_id = bucket_map.get(predicted_bucket.lower())
                    if matched_bucket_id:
                        categorization_results[idx]['bucket_id'] = matched_bucket_id
                        categorization_results[idx]['confidence'] = ai_confidence
                        categorization_results[idx]['is_verified'] = False
                        
            logger.info(f"AI categorized {len(ai_predictions)}/{len(pending_transactions)} transactions")
        except Exception as e:
            logger.warning(f"AI categorization failed: {e}")
            report_progress(total, f"Complete (AI unavailable, {len(pending_transactions)} uncategorized)")
    
    # Build preview transactions
    preview_transactions = []
    for i, result in enumerate(categorization_results):
        data = result['raw_data']
        bucket = bucket_by_id.get(result['bucket_id']) if result['bucket_id'] else None
        bucket_dict = None
        if bucket:
            bucket_dict = {
                'id': bucket.id,
                'name': bucket.name,
                'icon_name': bucket.icon_name,
                'group': bucket.group,
                'is_transfer': bucket.is_transfer,
                'is_investment': bucket.is_investment,
                'is_hidden': getattr(bucket, 'is_hidden', False),
                'parent_id': bucket.parent_id,
                'display_order': bucket.display_order,
            }

        preview_txn = {
            'id': -(i + 1),
            'user_id': user.id,
            'date': data["date"].isoformat() if hasattr(data["date"], 'isoformat') else str(data["date"]),
            'description': result['clean_desc'],
            'raw_description': data["description"],
            'amount': data["amount"],
            'bucket_id': result['bucket_id'],
            'bucket': bucket_dict,
            'category_confidence': result['confidence'],
            'is_verified': result['is_verified'],
            'spender': spender,
            'tags': result.get('tags'),
            'transaction_hash': result['txn_hash'],
            'goal_id': None,
            'external_id': None,
            'account_id': None,
            'assigned_to': None
        }
        preview_transactions.append(preview_txn)
    
    report_progress(total, "Complete")
    return preview_transactions, duplicate_count


@router.post("/csv/preview")
async def preview_csv(file: UploadFile = File(...)):
    """Preview CSV file structure before import."""
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await validate_file_size(file)
    
    try:
        return parse_preview(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("CSV preview failed")
        raise HTTPException(status_code=500, detail="Failed to parse CSV file")

@router.post("/csv", response_model=List[schemas.Transaction])
async def ingest_csv(
    file: UploadFile = File(...),
    map_date: str = Form(...),
    map_desc: str = Form(...),
    map_amount: str = Form(None), # Optional now
    map_debit: str = Form(None), # New
    map_credit: str = Form(None), # New
    spender: str = Form("Joint"),
    skip_duplicates: bool = Form(True),  # New: duplicate detection
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    content = await file.read()
    mapping = {
        "date": map_date, 
        "description": map_desc, 
        "amount": map_amount,
        "debit": map_debit,
        "credit": map_credit
    }
    
    try:
        extracted_data = process_csv(content, mapping)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not extracted_data:
        return []
    
    # Preview only - no DB save
    preview_txns, duplicate_count = process_transactions_preview(
        extracted_data, current_user, db, spender, skip_duplicates
    )
    
    # Log duplicate info
    if duplicate_count > 0:
        logger.info(f"Skipped {duplicate_count} duplicate transactions during preview")
    
    return preview_txns


# ============== ASYNC PROCESSING ENDPOINTS ==============

def process_csv_background(
    job_id: str, user_id: str, content: bytes, mapping: Dict[str, str], spender: str, skip_duplicates: bool
):
    # Job creation moved to start_csv_import within DB session context because we need the session
    db = None
    error_msg = None
    result_transactions = []
    try:
        # Create a new database session for this thread
        db = SessionLocal()
        user = db.query(models.User).filter(models.User.id == str(user_id)).first()
        
        # ... logic ...
        
        # Initialize buckets cache
        # ...

        
        if not user:
            fail_job(db, job_id, "User not found")
            return
        
        update_job_progress(db, job_id, 0, "Parsing CSV...")
        
        # Parse CSV
        try:
            extracted_data = process_csv(content, mapping)
        except Exception as e:
            fail_job(db, job_id, f"CSV parsing error: {str(e)}")
            return
        
        if not extracted_data:
            complete_job(db, job_id, [])
            return
        
        # Update job total with actual count
        update_job_total(db, job_id, len(extracted_data))
        update_job_progress(db, job_id, 0, f"Processing {len(extracted_data)} transactions...")
        
        # Process with progress updates
        preview_txns, duplicate_count = process_transactions_preview_with_progress(
            extracted_data, user, db, spender, skip_duplicates,
            progress_callback=lambda p, m: update_job_progress(db, job_id, p, m)
        )
        
        result_transactions = preview_txns
        if result_transactions:
            complete_job(db, job_id, result_transactions)
        else:
            if not error_msg:
                 error_msg = "No transactions found"
            fail_job(db, job_id, error_msg)

    except Exception as e:
        logger.error(f"Background CSV processing failed: {str(e)}")
        # We need a fresh session to record failure if the main one is broken
        try:
            db_fail = SessionLocal()
            fail_job(db_fail, job_id, str(e))
            db_fail.close()
        except:
            pass
    finally:
        if db:
            db.close()


@router.post("/csv/start")
async def start_csv_import(
    file: UploadFile = File(...),
    map_date: str = Form(...),
    map_desc: str = Form(...),
    map_amount: str = Form(None),
    map_debit: str = Form(None),
    map_credit: str = Form(None),
    spender: str = Form("Joint"),
    skip_duplicates: bool = Form(True),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Start async CSV import - returns immediately with job_id."""
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await validate_file_size(file)
    mapping = {
        "date": map_date, 
        "description": map_desc, 
        "amount": map_amount,
        "debit": map_debit,
        "credit": map_credit
    }
    
    # Quick parse to get transaction count for progress tracking
    try:
        preview = parse_preview(content)
        total_rows = preview.get('row_count', 100)  # Estimate if not available
    except:
        total_rows = 100  # Default estimate
    
    # Clean up old jobs for this user
    cleanup_old_jobs(db, current_user.id)
    
    # Create job in DB
    job_id = create_job(db, current_user.id, total_rows)
    
    # Start background thread
    thread = threading.Thread(
        target=process_csv_background,
        args=(job_id, current_user.id, content, mapping, spender, skip_duplicates)
    )
    thread.daemon = True
    thread.start()
    
    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Import started",
        "total": total_rows
    }


@router.get("/csv/status/{job_id}")
def check_csv_status(job_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    status = get_job_status(db, current_user.id, job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status

# ============================================================

@router.post("/upload", response_model=List[schemas.Transaction])
async def upload_statement(
    file: UploadFile = File(...), 
    spender: str = Form("Joint"),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Upload and parse a PDF bank statement."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Validate file size
    content = await validate_file_size(file)
    
    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name
        
    try:
        extracted_data = parse_pdf(tmp_path)
    except Exception:
        logger.exception("PDF parsing failed")
        raise HTTPException(status_code=500, detail="Failed to parse PDF file")
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
    if not extracted_data:
        return []

    # Preview only - no DB save
    preview_txns, duplicate_count = process_transactions_preview(
        extracted_data, current_user, db, spender, skip_duplicates=True
    )
    
    if duplicate_count > 0:
        logger.info(f"Skipped {duplicate_count} duplicate transactions during preview")
    
    return preview_txns


@router.post("/confirm", response_model=List[schemas.Transaction])
def confirm_transactions(updates: List[schemas.TransactionConfirm], db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Bulk confirm transactions.
    - For preview transactions (id < 0): Creates new transactions in DB
    - For existing transactions (id > 0): Updates bucket_id and marks is_verified=True
    """
    from datetime import datetime
    
    confirmed_ids = []
    
    for update in updates:
        if update.id < 0:
            # NEW TRANSACTION FROM PREVIEW - Create in DB
            if not all([update.date, update.description, update.amount is not None]):
                logger.warning(f"Skipping preview transaction {update.id}: missing required fields")
                continue
            
            # Parse date
            try:
                txn_date = datetime.fromisoformat(update.date.replace('Z', '+00:00'))
            except:
                txn_date = datetime.strptime(update.date, "%Y-%m-%d")
            
            # --- DEDUPLICATION CHECK ---
            # Even though preview does this, we must check again in case of retry/double-submit
            txn_hash = generate_transaction_hash(
                current_user.id, 
                txn_date, 
                update.raw_description or update.description, 
                update.amount
            )
            
            existing = db.query(models.Transaction).filter(
                models.Transaction.user_id == str(current_user.id),
                models.Transaction.transaction_hash == txn_hash
            ).first()
            
            if existing:
                logger.info(f"Skipping duplicate transaction on confirm: {update.description}")
                continue
            # ---------------------------

            db_txn = models.Transaction(
                date=txn_date,

                description=update.description,
                raw_description=update.raw_description or update.description,
                amount=update.amount,
                user_id=current_user.id,
                bucket_id=update.bucket_id,
                is_verified=True,  # User confirmed = verified
                spender=update.spender or "Joint",
                goal_id=update.goal_id,
                tags=update.tags,
                assigned_to=update.assigned_to,
                transaction_hash=txn_hash 
            )

            db.add(db_txn)
            db.flush()  # Get the ID without committing
            confirmed_ids.append(db_txn.id)
            
            # Note: Auto-rule creation has been removed.
            # Rules are now created explicitly via Smart Rules page or CreateRuleModal.
        else:
            # EXISTING TRANSACTION - Update
            txn = db.query(models.Transaction).filter(
                models.Transaction.id == update.id, 
                models.Transaction.user_id == current_user.id
            ).first()
            
            if txn:
                txn.bucket_id = update.bucket_id
                if update.spender:
                    txn.spender = update.spender
                if update.assigned_to is not None:
                    txn.assigned_to = update.assigned_to if update.assigned_to else None
                if update.tags is not None:
                    txn.tags = update.tags
                txn.is_verified = True
                confirmed_ids.append(txn.id)
                
                # Note: No auto-learning for existing transaction updates
                # These are often corrections, not patterns to learn from
    
    db.commit()
    
    # Check budget exceeded for affected buckets
    affected_bucket_ids = set()
    for update in updates:
        if update.bucket_id:
            affected_bucket_ids.add(update.bucket_id)
    
    for bucket_id in affected_bucket_ids:
        NotificationService.check_budget_exceeded(db, current_user.id, bucket_id)
    
    # Return confirmed transactions
    if confirmed_ids:
        results = db.query(models.Transaction)\
            .options(joinedload(models.Transaction.bucket))\
            .filter(models.Transaction.id.in_(confirmed_ids))\
            .all()
        return results
    return []

# Helper function
def generate_transaction_hash(user_id, date, raw_description: str, amount: float) -> str:
    """
    Generate a unique fingerprint for duplicate detection.
    Uses: user_id + date + raw_description + absolute amount
    """
    date_str = date.isoformat() if hasattr(date, 'isoformat') else str(date)
    # Ensure raw_description is string, handle None
    desc_str = (raw_description or "").lower().strip()
    key = f"{user_id}|{date_str}|{desc_str}|{abs(round(amount, 2))}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]

