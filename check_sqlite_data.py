import sqlite3
from pathlib import Path

db_path = Path("verity.db")

print("SQLITE DATABASE:", db_path.resolve())

if not db_path.exists():
    print("ERROR: verity.db not found.")
    raise SystemExit(1)

conn = sqlite3.connect(db_path)

tables = [
    "users",
    "brand_guidelines",
    "reviews",
    "governance_items",
    "audit_logs"
]

print("\nSQLITE DATA CHECK:")

existing = {
    row[0] for row in
    conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
}

for table in tables:
    if table in existing:
        count = conn.execute(
            f'SELECT COUNT(*) FROM "{table}"'
        ).fetchone()[0]
        print(f"{table}: {count} records")
    else:
        print(f"{table}: TABLE NOT FOUND")

conn.close()
