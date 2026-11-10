import os
import sqlite3
from pathlib import Path

import psycopg
from psycopg.rows import dict_row


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQLITE_DB_PATH = PROJECT_ROOT / "verity.db"


def is_postgres():
    return bool(os.getenv("DATABASE_URL"))


def get_placeholder():
    return "%s" if is_postgres() else "?"


def get_connection():
    """
    Return PostgreSQL when DATABASE_URL is configured.
    Otherwise, use the existing SQLite database.
    """
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return psycopg.connect(
            database_url,
            row_factory=dict_row,
            connect_timeout=15,
        )

    connection = sqlite3.connect(SQLITE_DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection
