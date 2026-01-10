import os
import sys
from sqlalchemy.schema import CreateTable
from sqlalchemy import create_engine
from sqlalchemy.dialects import postgresql

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.models import Base
from backend.database import engine

def generate_ddl():
    # Sort tables by dependency
    sorted_tables = Base.metadata.sorted_tables
    
    print("-- Auto-generated DDL for Supabase Migration")
    print("-- Run this in Supabase SQL Editor")
    print("\n")

    for table in sorted_tables:
        if table.name == "users":
            # Handle Users specifically to map to auth.users or create public proxy
            # For now, we'll create a public.users table that references auth.users
            # BUT we need to change ID to UUID
            print(f"-- Table: {table.name} (Customized for Supabase)")
            print("""
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email text,
    name text,
    currency_symbol text DEFAULT 'AUD',
    is_email_verified boolean DEFAULT false,
    token_version integer DEFAULT 0,
    created_at timestamp with time zone,
    household_id integer, -- Circular dep, nullable
    mfa_enabled boolean DEFAULT false,
    mfa_secret text,
    mfa_backup_codes text
);
            """)
            continue

        # Get the strict DDL
        # We need to intercept User FKs and change type to UUID
        
        # This is hard to do perfectly with simple string replacement, 
        # but given our consistent naming (user_id), we can try.
        
        ddl = CreateTable(table).compile(dialect=postgresql.dialect())
        ddl_str = str(ddl).strip()
        
        # Replace Integer user_id with UUID
        # Pattern: user_id INTEGER
        # We also need to remove 'REFERENCES users(id)' or change to 'REFERENCES auth.users(id)'
        # or 'REFERENCES public.users(id)' (since we created public proxy above)
        
        # Replacing column definitions
        ddl_str = ddl_str.replace("user_id INTEGER", "user_id UUID")
        ddl_str = ddl_str.replace("owner_id INTEGER", "owner_id UUID") # for households
        ddl_str = ddl_str.replace("invited_by_id INTEGER", "invited_by_id UUID") # for invites
        
        # Replace Foreign Keys
        # "FOREIGN KEY(user_id) REFERENCES users (id)" -> "FOREIGN KEY(user_id) REFERENCES public.users (id)"
        # Note: SQLAlchemy output might vary.
        
        # Check if table refers to users
        # For simplicity in this script, let's output the standard DDL and add comments
        # Manual review is better than broken regex.
        
        print(f"-- Table: {table.name}")
        print(ddl_str + ";")
        print("\n")

if __name__ == "__main__":
    generate_ddl()
