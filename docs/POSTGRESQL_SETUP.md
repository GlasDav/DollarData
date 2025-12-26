# PostgreSQL Deployment Guide

## Quick Start

### Option 1: Supabase (Recommended for getting started)
1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database > Connection string (URI)
4. Set environment variable:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

### Option 2: Railway
1. Create account at [railway.app](https://railway.app)
2. New Project > Database > PostgreSQL
3. Copy connection string from Variables

### Option 3: Local Docker
```bash
docker run -d --name principal-postgres \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_DB=principal \
  -p 5432:5432 \
  postgres:15
```

Set: `DATABASE_URL=postgresql://postgres:secretpassword@localhost:5432/principal`

## Environment Variables

```env
# Production
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key-here

# Optional
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=https://yourdomain.com
```

## Run Migration
After connecting to PostgreSQL, run the index migration:
```bash
psql $DATABASE_URL -f backend/migrations/001_add_indexes.sql
```

## Production Deployment
```bash
# Install gunicorn
pip install gunicorn

# Run with 4 workers (adjust based on CPU cores)
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
