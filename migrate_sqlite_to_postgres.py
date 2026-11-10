import sqlite3
from dotenv import load_dotenv
from psycopg import sql

load_dotenv()

from backend.database import get_connection

TABLES = [
    "users",
    "brands",
    "brand_guidelines",
    "reviews",
    "guideline_versions",
    "review_findings",
    "governance_items",
    "governance",
    "evidence",
    "analytics",
    "audit_logs"
]

sqlite_conn = sqlite3.connect("verity.db")

try:
    source_data = {}
    source_counts = {}

    print("Checking SQLite source database...")

    for table in TABLES:
        columns = [
            row[1]
            for row in sqlite_conn.execute(
                f'PRAGMA table_info("{table}")'
            ).fetchall()
        ]

        if not columns:
            raise RuntimeError(f"SQLite table missing: {table}")

        rows = sqlite_conn.execute(
            f'SELECT * FROM "{table}"'
        ).fetchall()

        source_data[table] = (columns, rows)
        source_counts[table] = len(rows)

    print("SQLite source verified.")

    migrated_counts = {}

    with get_connection() as pg_conn:

        print("Checking PostgreSQL destination...")

        for table in TABLES:
            count = pg_conn.execute(
                sql.SQL("SELECT COUNT(*) AS total FROM {}").format(
                    sql.Identifier(table)
                )
            ).fetchone()["total"]

            if count != 0:
                raise RuntimeError(
                    f"Migration stopped: PostgreSQL table "
                    f"{table} already contains {count} records."
                )

        print("All PostgreSQL destination tables are empty.")

        for table in TABLES:
            source_columns, rows = source_data[table]

            target_columns = pg_conn.execute(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = %s
                ORDER BY ordinal_position
                """,
                (table,)
            ).fetchall()

            target_names = [
                row["column_name"] for row in target_columns
            ]

            if set(source_columns) != set(target_names):
                raise RuntimeError(
                    f"Column mismatch detected in table {table}."
                )

            if rows:
                insert_query = sql.SQL(
                    "INSERT INTO {} ({}) VALUES ({})"
                ).format(
                    sql.Identifier(table),
                    sql.SQL(", ").join(
                        sql.Identifier(col) for col in source_columns
                    ),
                    sql.SQL(", ").join(
                        sql.Placeholder() for _ in source_columns
                    )
                )

                for record in rows:
                    pg_conn.execute(insert_query, tuple(record))

            migrated_counts[table] = len(rows)

        print("Synchronizing PostgreSQL ID sequences...")

        for table in TABLES:
            sequence_query = sql.SQL("""
                SELECT setval(
                    pg_get_serial_sequence(%s, 'id'),
                    GREATEST(COALESCE(MAX(id), 1), 1),
                    COUNT(*) > 0
                )
                FROM {}
            """).format(sql.Identifier(table))

            pg_conn.execute(sequence_query, (f"public.{table}",))

        print("Verifying migrated record counts...")

        for table in TABLES:
            actual = pg_conn.execute(
                sql.SQL(
                    "SELECT COUNT(*) AS total FROM {}"
                ).format(sql.Identifier(table))
            ).fetchone()["total"]

            if actual != source_counts[table]:
                raise RuntimeError(
                    f"Record count mismatch in {table}: "
                    f"SQLite={source_counts[table]}, PostgreSQL={actual}"
                )

    print("\nMIGRATION SUCCESSFUL")
    print("==============================")

    for table in TABLES:
        print(f"{table}: {migrated_counts[table]} records transferred")

    print("==============================")
    print("All record counts verified.")
    print("Original SQLite database remains unchanged.")

finally:
    sqlite_conn.close()
