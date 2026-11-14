import sqlite3
from dotenv import load_dotenv

load_dotenv()

from backend.database import get_connection

tables = [
    "users",
    "brand_guidelines",
    "reviews",
    "governance_items",
    "audit_logs",
    "brands",
    "guideline_versions",
    "review_findings",
    "evidence",
    "governance",
    "analytics"
]

sqlite_conn = sqlite3.connect("verity.db")
postgres_conn = get_connection()

print("========== SQLITE STRUCTURE ==========")

for table in tables:
    try:
        rows = sqlite_conn.execute(
            f'PRAGMA table_info("{table}")'
        ).fetchall()

        print(f"\n{table}:")
        for row in rows:
            print(f"  {row[1]} | {row[2]} | Primary key: {row[5]}")
    except Exception as e:
        print(f"{table}: {e}")

print("\n========== POSTGRESQL STRUCTURE ==========")

for table in tables:
    rows = postgres_conn.execute(
        """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = %s
        ORDER BY ordinal_position
        """,
        (table,)
    ).fetchall()

    print(f"\n{table}:")
    for row in rows:
        print(f"  {row['column_name']} | {row['data_type']} | Nullable: {row['is_nullable']}")

sqlite_conn.close()
postgres_conn.close()
