from dotenv import load_dotenv
load_dotenv()

from backend.database import get_connection

conn = get_connection()

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

print("========== POSTGRESQL ID DEFAULTS ==========")

for table in tables:
    rows = conn.execute("""
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = %s
        AND column_name = 'id'
    """, (table,)).fetchall()

    for row in rows:
        print(f"{table}: {row['column_default']}")

print("\n========== POSTGRESQL FOREIGN KEYS ==========")

rows = conn.execute("""
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_schema = 'public'
    ORDER BY tc.table_name
""").fetchall()

for row in rows:
    print(
        f"{row['table_name']}.{row['column_name']} "
        f"-> {row['referenced_table']}.{row['referenced_column']}"
    )

conn.close()
