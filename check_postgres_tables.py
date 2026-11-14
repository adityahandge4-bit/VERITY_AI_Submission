from dotenv import load_dotenv
load_dotenv()

from backend.database import get_connection

conn = get_connection()

rows = conn.execute("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
""").fetchall()

print("POSTGRESQL TABLES:")
for row in rows:
    print(row["table_name"])

conn.close()
