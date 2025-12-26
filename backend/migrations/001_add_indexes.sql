-- Principal Finance: Database Optimization Indexes
-- Run this after migrating to PostgreSQL for optimal performance

-- Composite index for transactions by user and date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, date DESC);

-- Index for transactions by bucket (category analysis)
CREATE INDEX IF NOT EXISTS idx_transactions_bucket 
ON transactions(bucket_id);

-- Index for buckets by user
CREATE INDEX IF NOT EXISTS idx_buckets_user 
ON budget_buckets(user_id);

-- Index for accounts by user
CREATE INDEX IF NOT EXISTS idx_accounts_user 
ON accounts(user_id);

-- Index for subscriptions by user and active status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active 
ON subscriptions(user_id, is_active);

-- Index for goals by user
CREATE INDEX IF NOT EXISTS idx_goals_user 
ON goals(user_id);

-- Index for notifications by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read);

-- Index for net worth snapshots by user and date
CREATE INDEX IF NOT EXISTS idx_net_worth_user_date 
ON net_worth_snapshots(user_id, date DESC);

-- Analyze tables after index creation (PostgreSQL only)
ANALYZE transactions;
ANALYZE budget_buckets;
ANALYZE accounts;
ANALYZE subscriptions;
ANALYZE goals;
ANALYZE notifications;
ANALYZE net_worth_snapshots;
