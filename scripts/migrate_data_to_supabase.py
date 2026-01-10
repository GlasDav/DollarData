import os
import sys
import asyncio
import json
from datetime import datetime, date
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from supabase import create_client, Client

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.supabase'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Critical: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Legacy DB Config
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'principal_v5.db')
    DATABASE_URL = f"sqlite:///{db_path}"
    print(f"⚠️  Using SQLite default: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Load ID Mapping
mapping_path = os.path.join(os.path.dirname(__file__), 'id_mapping.json')
if not os.path.exists(mapping_path):
    print("❌ id_mapping.json not found. Run migrate_users_to_supabase.py first.")
    sys.exit(1)

with open(mapping_path, 'r') as f:
    # Keys are strings in JSON, convert to int for lookup
    ID_MAPPING = {int(k): v for k, v in json.load(f).items()}

print(f"✅ Loaded {len(ID_MAPPING)} user mappings.")

# Define migration order (parents first)
TABLES = [
    # Core
    'households', # Has owner_id
    'household_members', # Has user_id, linked to household? Wait, existing schema?
    # Actually, let's just do bulk tables.
    # We must replace 'user_id' in all of them.
    'users', # We need to populate public.users from legacy users info
    'goals',
    'accounts',
    'budget_buckets',
    # Children
    'transactions',
    'subscriptions',
    'household_users',
    'household_invites',
    'api_keys',
    'notification_settings',
    'notifications',
    # Deep children
    'investment_holdings',
    'household_members', # Wait, verify dependency
    'budget_limits',
    'categorization_rules',
    'net_worth_snapshots', 
    'account_balances',
    'category_goals',
    'ignored_rule_patterns',
    'tax_settings'
]

# Helper to serialize dates for JSON
def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj

async def migrate_table(table_name):
    print(f"\n🔄 Migrating table: {table_name}")
    
    # 1. Fetch from Legacy
    try:
        # Use simple text query to avoid importing all models
        result = session.execute(text(f"SELECT * FROM {table_name}"))
        rows = result.fetchall()
        columns = result.keys()
    except Exception as e:
        print(f"   ⚠️  Skipping/Error {table_name}: {e}")
        return

    records = []
    skipped = 0
    
    for row in rows:
        # Convert row to dict
        data = dict(zip(columns, row))
        
        # TRANSFORMATION ------------------------
        
        # 1. Map user_id
        if 'user_id' in data and data['user_id'] is not None:
            legacy_uid = data['user_id']
            if legacy_uid in ID_MAPPING:
                data['user_id'] = ID_MAPPING[legacy_uid]
            else:
                # User not migrated? Skip record?
                # print(f"   Warning: User ID {legacy_uid} not in mapping. Skipping.")
                skipped += 1
                continue
                
        # 2. Map owner_id (Households)
        if 'owner_id' in data and data['owner_id'] is not None:
             legacy_oid = data['owner_id']
             if legacy_oid in ID_MAPPING:
                 data['owner_id'] = ID_MAPPING[legacy_oid]
        
        # 3. Map invited_by_id (Invites)
        if 'invited_by_id' in data and data['invited_by_id'] is not None:
             legacy_iid = data['invited_by_id']
             if legacy_iid in ID_MAPPING:
                 data['invited_by_id'] = ID_MAPPING[legacy_iid]

        # 4. Handle 'users' table specifically for public.users
        if table_name == 'users':
            # Remap ID to UUID
            legacy_id = data.pop('id') # Remove integer ID
            if legacy_id in ID_MAPPING:
                data['id'] = ID_MAPPING[legacy_id]
            else:
                continue
            # Remove password hash
            if 'hashed_password' in data: 
                del data['hashed_password']
            
            # Remove columns that don't exist in public.users?
            # Ideally we only insert valid columns. 
            # Supabase-py will complain if extra keys exist.
            # We assume target schema matches.
            
        # 5. Clean Data Types
        for k, v in data.items():
            if isinstance(v, (datetime, date)):
                data[k] = v.isoformat()
        
        records.append(data)

    if not records:
        print("   No records to migrate.")
        return

    # 2. Insert to Supabase (Batch)
    batch_size = 100
    print(f"   Pushing {len(records)} records...")
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            # We use 'upsert' to be safe? Or insert.
            # upsert requires PK. 
            response = supabase.table(table_name).upsert(batch).execute()
            # print(f"   Batch {i//batch_size + 1}: Success")
        except Exception as e:
            print(f"   ❌ Error inserting batch: {str(e)}")
            # print(batch[0]) # Limit log

    print(f"   ✅ Done. (Skipped {skipped} records due to missing user map)")


async def main():
    print("🚀 Starting Data Migration to SupabaseDB...")
    
    # 0. Migrate Public User Profiles
    await migrate_table('users') 
    
    # 1. Iterate Tables
    for table in TABLES:
        if table == 'users': continue
        await migrate_table(table)
        
    print("\n\n✨ Migration Complete.")
    print("Note: You may need to reset Primary Key sequences in Supabase SQL Editor:")
    print("SELECT setval('table_id_seq', (SELECT MAX(id) FROM table));")

if __name__ == "__main__":
    asyncio.run(main())
