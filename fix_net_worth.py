import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend.routers.net_worth import recalculate_snapshot
from backend import models

def fix():
    db = SessionLocal()
    try:
        snapshots = db.query(models.NetWorthSnapshot).all()
        print(f"Found {len(snapshots)} snapshots to recalculate...")
        for s in snapshots:
            print(f"Recalculating snapshot {s.id} ({s.date})...")
            recalculate_snapshot(db, s.id)
            print(f"  Result: Assets={s.total_assets}, Liab={s.total_liabilities}, NW={s.net_worth}")
        print("Done.")
    finally:
        db.close()

if __name__ == "__main__":
    fix()
