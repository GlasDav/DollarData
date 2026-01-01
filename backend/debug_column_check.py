import logging
import sys
from sqlalchemy import create_engine, inspect
import os

# Setup simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_columns")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://principal_user:principal_password@db:5432/principal_db")

# If running locally (not in docker), might need localhost
# But user executes this via docker exec possibly? No, user runs on Windows?
# Ah, I'm on Windows. I can't run this against the Docker DB directly unless port is exposed.
# But I can ask the user to run it? No, I need to run it via `run_command`... but I can't `run_command` inside the container easily.
# Wait, I can assume the user runs `python backend/debug_column_check.py` inside the container?
# Or I can just inspect the `auto_migrate.py` logic more carefully.

def check_columns():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        if "budget_buckets" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("budget_buckets")]
            print(f"Columns in 'budget_buckets': {columns}")
            
            if "is_group_budget" in columns:
                print("SUCCESS: 'is_group_budget' column EXISTS.")
            else:
                print("FAILURE: 'is_group_budget' column MISSING!")
                
            if "is_shared" in columns:
                 print("INFO: 'is_shared' column EXISTS.")
            else:
                 print("INFO: 'is_shared' column MISSING.")
        else:
            print("Table 'budget_buckets' not found!")
            
    except Exception as e:
        print(f"Error connecting/inspecting: {e}")

if __name__ == "__main__":
    check_columns()
