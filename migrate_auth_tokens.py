"""
Migration script to add email verification and password reset features.
Run this once to update the existing database schema.
"""
import sqlite3
import os

# Get database path
db_path = os.path.join(os.path.dirname(__file__), 'principal.db')
if not os.path.exists(db_path):
    db_path = os.path.join(os.path.dirname(__file__), 'principal_v5.db')

print(f"Migrating database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add is_email_verified column to users table
try:
    cursor.execute("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT 0")
    print("✓ Added is_email_verified column to users table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("- is_email_verified column already exists")
    else:
        raise

# Create password_reset_tokens table
cursor.execute("""
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
""")
cursor.execute("CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token_hash ON password_reset_tokens(token_hash)")
print("✓ Created password_reset_tokens table")

# Create email_verification_tokens table
cursor.execute("""
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
""")
cursor.execute("CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_token_hash ON email_verification_tokens(token_hash)")
print("✓ Created email_verification_tokens table")

conn.commit()
conn.close()

print("\n✅ Migration complete!")
