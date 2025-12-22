import sqlite3
import tempfile
import os

db_path = os.path.join(tempfile.gettempdir(), "principal_v5_temp.db")
print(f"Database: {db_path}")
print(f"Exists: {os.path.exists(db_path)}")
print(f"Size: {os.path.getsize(db_path)} bytes")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\nTables:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
for row in cursor.fetchall():
    print(f"  {row[0]}")

print("\nBudgetbuckets columns:")
cursor.execute("PRAGMA table_info(budgetbuckets)")
for row in cursor.fetchall():
    print(f"  {row}")

conn.close()
