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

print("========== SQLITE vs POSTGRESQL ==========")

for table in tables:
    sqlite_count = sqlite_conn.execute(
        f'SELECT COUNT(*) FROM "{table}"'
    ).fetchone()[0]

    postgres_count = postgres_conn.execute(
        f'SELECT COUNT(*) AS total FROM "{table}"'
    ).fetchone()["total"]

    print(
        f"{table}: SQLite={sqlite_count}, "
        f"PostgreSQL={postgres_count}"
    )

sqlite_conn.close()
postgres_conn.close()
