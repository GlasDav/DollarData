import sqlite3
import tempfile
import os

db_path = os.path.join(tempfile.gettempdir(), "principal_v5_temp.db")
print(f"Database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check columns
print("\nBudget_buckets columns:")
cursor.execute("PRAGMA table_info(budget_buckets)")
columns = []
for row in cursor.fetchall():
    columns.append(row[1])
    print(f"  {row[1]}: {row[2]}")

# Add column if missing
if 'is_investment' not in columns:
    print("\nAdding is_investment column...")
    cursor.execute("ALTER TABLE budget_buckets ADD COLUMN is_investment BOOLEAN DEFAULT 0")
    conn.commit()
    print("Column added!")
else:
    print("\nis_investment column already exists!")

# Get all users
cursor.execute("SELECT id, email FROM users")
users = cursor.fetchall()
print(f"\nFound {len(users)} users")

# Add Investments bucket for each
for user_id, email in users:
    # Check if bucket exists
    cursor.execute("SELECT id FROM budget_buckets WHERE user_id = ? AND name = 'Investments'", (user_id,))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("UPDATE budget_buckets SET is_investment = 1 WHERE id = ?", (existing[0],))
        print(f"  [OK] Marked existing for {email}")
    else:
        cursor.execute("""
            INSERT INTO budget_buckets 
            (name, icon_name, user_id, monthly_limit_a, monthly_limit_b, is_shared, is_rollover, is_transfer, is_investment, [group])
            VALUES ('Investments', 'TrendingUp', ?, 0.0, 0.0, 0, 0, 0, 1, 'Non-Discretionary')
        """, (user_id,))
        print(f"  [OK] Created for {email}")

conn.commit()
conn.close()
print("\nMigration complete on temp database!")
print(f"\nNow copy back: Copy-Item '{db_path}' principal_v5.db -Force")
