"""
Migration script to update users table schema to match current model.
"""
import sqlite3
import os

db_path = 'principal.db'
print(f"Migrating database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get current columns
cursor.execute('PRAGMA table_info(users)')
columns = [r[1] for r in cursor.fetchall()]
print(f"Current columns: {columns}")

# Add missing columns
columns_to_add = [
    ("email", "VARCHAR", None),
    ("hashed_password", "VARCHAR", None),
    ("name_a", "VARCHAR", "'You'"),
    ("name_b", "VARCHAR", "'Partner'"),
    ("currency_symbol", "VARCHAR", "'AUD'"),
]

for col_name, col_type, default in columns_to_add:
    if col_name not in columns:
        try:
            if default:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type} DEFAULT {default}")
            else:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"✓ Added {col_name} column")
        except sqlite3.OperationalError as e:
            print(f"- {col_name}: {e}")
    else:
        print(f"- {col_name} column already exists")

# If there's a username column but no email, copy username to email
if 'username' in columns and 'email' in columns:
    cursor.execute("UPDATE users SET email = username WHERE email IS NULL")
    print("✓ Copied username to email for existing users")

# Set a default hashed password for existing users (they'll need to reset)
# This is a hash of a random string - users will need to use Google or reset password
cursor.execute("""
    UPDATE users 
    SET hashed_password = '$argon2id$v=19$m=65536,t=3,p=4$placeholder$placeholder'
    WHERE hashed_password IS NULL
""")
print("✓ Set placeholder password for existing users (they'll need to reset)")

conn.commit()

# Verify
cursor.execute('PRAGMA table_info(users)')
columns = [r[1] for r in cursor.fetchall()]
print(f"\nFinal columns: {columns}")

cursor.execute('SELECT id, email, name_a FROM users')
print(f"Users: {cursor.fetchall()}")

conn.close()
print("\n✅ Migration complete!")
