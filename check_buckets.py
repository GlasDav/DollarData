import sqlite3

conn = sqlite3.connect('principal_v5.db')
cur = conn.cursor()

# Check income by bucket group for user 1
cur.execute("""
    SELECT b."group", b.name, SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN budget_buckets b ON t.bucket_id = b.id
    WHERE t.user_id=1 AND t.amount > 0
    GROUP BY b."group", b.name
    ORDER BY total DESC
""")
print("Income by bucket (all groups):")
for row in cur.fetchall():
    print(f"  Group='{row[0]}', Bucket='{row[1]}', Total=${row[2]:,.2f}")

conn.close()
