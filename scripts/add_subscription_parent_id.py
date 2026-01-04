"""
Migration script to add parent_id column to subscriptions table.
This fixes the 500 error on /analytics/subscriptions endpoints.

For PostgreSQL production: Run via Render shell or local psql connection
For SQLite development: Run as python script
"""
import os
import sys

# Add the backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))


def migrate_postgresql():
    """Migrate PostgreSQL database (production)."""
    import psycopg2
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        print("Set this to your PostgreSQL connection string.")
        return False
    
    # Handle Render's postgres:// vs postgresql:// URL format
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' AND column_name = 'parent_id'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'parent_id' already exists in 'subscriptions' table.")
            conn.close()
            return True
        
        # Add the column
        print("Adding 'parent_id' column to 'subscriptions' table...")
        cursor.execute("""
            ALTER TABLE subscriptions 
            ADD COLUMN parent_id INTEGER REFERENCES subscriptions(id)
        """)
        
        conn.commit()
        print("✓ Column 'parent_id' added successfully!")
        conn.close()
        return True
        
    except Exception as e:
        print(f"ERROR during PostgreSQL migration: {e}")
        return False


def migrate_sqlite():
    """Migrate SQLite database (development)."""
    import sqlite3
    
    db_paths = [
        'principal_v5.db',
        'backend/principal_v5.db',
        '../principal_v5.db',
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("No SQLite database found. Skipping SQLite migration.")
        return True
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(subscriptions)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'parent_id' in columns:
            print(f"✓ Column 'parent_id' already exists in '{db_path}'.")
            conn.close()
            return True
        
        # Add the column
        print(f"Adding 'parent_id' column to '{db_path}'...")
        cursor.execute("ALTER TABLE subscriptions ADD COLUMN parent_id INTEGER REFERENCES subscriptions(id)")
        
        conn.commit()
        print(f"✓ Column 'parent_id' added to '{db_path}' successfully!")
        conn.close()
        return True
        
    except Exception as e:
        print(f"ERROR during SQLite migration: {e}")
        return False


def main():
    print("=" * 50)
    print("Subscriptions Table Migration - Add parent_id")
    print("=" * 50)
    print()
    
    # Detect environment and run appropriate migration
    database_url = os.getenv('DATABASE_URL', '')
    
    if 'postgresql' in database_url or 'postgres' in database_url:
        print("Detected PostgreSQL environment.")
        success = migrate_postgresql()
    else:
        print("No PostgreSQL DATABASE_URL detected. Trying SQLite...")
        success = migrate_sqlite()
    
    print()
    if success:
        print("=" * 50)
        print("Migration completed successfully!")
        print("=" * 50)
    else:
        print("=" * 50)
        print("Migration FAILED. Please check the errors above.")
        print("=" * 50)
        sys.exit(1)


if __name__ == "__main__":
    main()
