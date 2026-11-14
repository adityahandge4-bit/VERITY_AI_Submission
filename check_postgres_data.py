from dotenv import load_dotenv
load_dotenv()

from backend.database import get_connection

tables = [
    "users",
    "brand_guidelines",
    "reviews",
    "governance_items",
    "audit_logs"
]

conn = get_connection()

print("POSTGRESQL DATA CHECK:")
for table in tables:
    count = conn.execute(f'SELECT COUNT(*) AS total FROM "{table}"').fetchone()
    print(f"{table}: {count['total']} records")

conn.close()
