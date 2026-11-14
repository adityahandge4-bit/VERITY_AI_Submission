import os
import json
import re
import uuid
from typing import Optional
from pydantic import BaseModel
import sqlite3
from pathlib import Path
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()
from backend.auth import get_current_user, router as auth_router
from backend.database import (
    get_connection,
    get_placeholder,
    is_postgres,
)
import fitz
from docx import Document
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VARIETY AI",
    description="The Brand Trust Compiler - AI-powered Brand Governance Platform",
    version="1.0.0"


)
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
     "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5177",
    "http://localhost:5179",
    "http://127.0.0.1:5179",
    "http://localhost:5178",
    "http://127.0.0.1:5178",
    "https://verity-ai-submission.vercel.app",
    "https://verity-ai-submission-git-feat-verity-premium-ui-pilgrims-pulse.vercel.app",
    "http://localhost:5180",
    "http://127.0.0.1:5180",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DB_PATH = Path(__file__).resolve().parent.parent / "verity.db"

def init_db():
    """Initialize core tables using SQLite or PostgreSQL."""

    postgres = is_postgres()

    id_column = (
        "SERIAL PRIMARY KEY"
        if postgres
        else "INTEGER PRIMARY KEY AUTOINCREMENT"
    )

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS brand_guidelines (
                id {id_column},
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                extracted_text TEXT,
                uploaded_at TEXT NOT NULL
            )
        """)

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS reviews (
                id {id_column},
                guideline_id INTEGER,
                guideline_filename TEXT,
                content TEXT NOT NULL,
                review_status TEXT NOT NULL,
                total_violations INTEGER DEFAULT 0,
                risk_high INTEGER DEFAULT 0,
                risk_medium INTEGER DEFAULT 0,
                risk_low INTEGER DEFAULT 0,
                findings TEXT,
                reviewed_at TEXT NOT NULL,
                engine_version TEXT DEFAULT '2.0'
            )
        """)

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS analytics (
                id {id_column},
                metric_name TEXT NOT NULL,
                metric_value REAL DEFAULT 0,
                metric_category TEXT,
                recorded_at TEXT NOT NULL
            )
        """)

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS governance (
                id {id_column},
                review_id INTEGER,
                finding_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                severity TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
                decision TEXT,
                assigned_to TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id {id_column},
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id INTEGER,
                details TEXT,
                performed_by TEXT,
                created_at TEXT NOT NULL
            )
        """)

        required_columns = {
            "reviews": {
                "guideline_id": "INTEGER",
                "guideline_filename": "TEXT",
                "content": "TEXT",
                "review_status": "TEXT",
                "total_violations": "INTEGER DEFAULT 0",
                "risk_high": "INTEGER DEFAULT 0",
                "risk_medium": "INTEGER DEFAULT 0",
                "risk_low": "INTEGER DEFAULT 0",
                "findings": "TEXT",
                "reviewed_at": "TEXT",
                "engine_version": "TEXT DEFAULT '2.0'"
            },
            "analytics": {
                "metric_name": "TEXT",
                "metric_value": "REAL DEFAULT 0",
                "metric_category": "TEXT",
                "recorded_at": "TEXT"
            },
            "governance": {
                "review_id": "INTEGER",
                "finding_id": "TEXT",
                "title": "TEXT",
                "description": "TEXT",
                "severity": "TEXT",
                "status": "TEXT DEFAULT 'OPEN'",
                "decision": "TEXT",
                "assigned_to": "TEXT",
                "created_at": "TEXT",
                "updated_at": "TEXT"
            },
            "audit_logs": {
                "action": "TEXT",
                "entity_type": "TEXT",
                "entity_id": "INTEGER",
                "details": "TEXT",
                "performed_by": "TEXT",
                "created_at": "TEXT"
            }
        }

        for table_name, columns in required_columns.items():

            if postgres:
                cursor.execute(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                    AND table_name = %s
                    """,
                    (table_name,)
                )

                existing_columns = {
                    row["column_name"]
                    for row in cursor.fetchall()
                }

            else:
                cursor.execute(
                    f"PRAGMA table_info({table_name})"
                )

                existing_columns = {
                    row[1]
                    for row in cursor.fetchall()
                }

            for column_name, column_type in columns.items():

                if column_name not in existing_columns:
                    cursor.execute(
                        f"""
                        ALTER TABLE {table_name}
                        ADD COLUMN {column_name} {column_type}
                        """
                    )

        conn.commit()

        print(
            "Core database initialization successful:",
            "PostgreSQL" if postgres else "SQLite"
        )

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


init_db()

def init_extended_db():
    """Create extended application tables using the configured database."""

    postgres = is_postgres()

    id_column = (
        "SERIAL PRIMARY KEY"
        if postgres
        else "INTEGER PRIMARY KEY AUTOINCREMENT"
    )

    with get_connection() as conn:

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS users (
                id {id_column},
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'Reviewer',
                created_at TEXT NOT NULL
            )
        """)

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS brands (
                id {id_column},
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS guideline_versions (
                id {id_column},
                guideline_id INTEGER NOT NULL,
                version TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                created_at TEXT NOT NULL
            )
        """)

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS review_findings (
                id {id_column},
                review_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                detected_text TEXT NOT NULL,
                explanation TEXT NOT NULL,
                suggestion TEXT NOT NULL,
                confidence INTEGER DEFAULT 90
            )
        """)

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS governance_items (
                id {id_column},
                review_id INTEGER,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                assigned_to TEXT DEFAULT '',
                due_date TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute(f"""
    CREATE TABLE IF NOT EXISTS evidence (
        id {id_column},
        user_id INTEGER,
        claim TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Review',
        confidence INTEGER DEFAULT 80,
        expires_at TEXT DEFAULT '',
        created_at TEXT NOT NULL
    )
""")



init_extended_db()



def init_workspace_ownership():
    """
    Add per-user ownership to legacy workspace tables.
    Existing records remain unassigned until their ownership
    can be verified. Never assign legacy records to a random user.
    """

    tables = [
        "brand_guidelines",
        "reviews",
        "analytics",
        "governance",
        "audit_logs",
        "brands",
        "guideline_versions",
        "review_findings",
        "governance_items",
        "evidence",
    ]

    with get_connection() as conn:
        for table_name in tables:

            if is_postgres():
                columns = conn.execute(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = %s
                    """,
                    (table_name,)
                ).fetchall()

                existing = {
                    row["column_name"] for row in columns
                }

            else:
                columns = conn.execute(
                    f"PRAGMA table_info({table_name})"
                ).fetchall()

                existing = {
                    row["name"] for row in columns
                }

            # Skip tables that do not exist yet.
            if not existing:
                continue

            # Add ownership column if missing.
            if "user_id" not in existing:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN user_id INTEGER
                    """
                )

            # Create an index for user-specific queries.
            conn.execute(
                f"""
                CREATE INDEX IF NOT EXISTS idx_{table_name}_user_id
                ON {table_name} (user_id)
                """
            )


init_workspace_ownership()



def init_settings_features_db():
    postgres = is_postgres()

    id_column = (
        "INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY"
        if postgres
        else "INTEGER PRIMARY KEY AUTOINCREMENT"
    )

    with get_connection() as conn:
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id INTEGER PRIMARY KEY,
                theme TEXT NOT NULL DEFAULT 'dark',
                density TEXT NOT NULL DEFAULT 'comfortable',
                accent_color TEXT NOT NULL DEFAULT 'violet',
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS workspace_settings (
                user_id INTEGER PRIMARY KEY,
                workspace_name TEXT NOT NULL DEFAULT 'My Workspace',
                company_name TEXT NOT NULL DEFAULT '',
                website TEXT NOT NULL DEFAULT '',
                brand_description TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS api_keys (
                id {id_column},
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                key_hash TEXT NOT NULL UNIQUE,
                key_prefix TEXT NOT NULL,
                scopes TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_used_at TEXT,
                revoked_at TEXT,
                expires_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                user_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
                created_at TEXT NOT NULL
            )
        """ if postgres else """
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
                created_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_api_keys_user
            ON api_keys (user_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_support_tickets_user
            ON support_tickets (user_id)
        """)


init_settings_features_db()


def init_notification_db():
    postgres = is_postgres()

    with get_connection() as conn:

        conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                priority TEXT NOT NULL DEFAULT 'normal',
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                read_at TEXT
            )
        """ if postgres else """
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                priority TEXT NOT NULL DEFAULT 'normal',
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                read_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS notification_preferences (
                user_id INTEGER PRIMARY KEY,
                in_app_enabled INTEGER NOT NULL DEFAULT 1,
                email_enabled INTEGER NOT NULL DEFAULT 0,
                browser_enabled INTEGER NOT NULL DEFAULT 0,
                review_alerts INTEGER NOT NULL DEFAULT 1,
                evidence_alerts INTEGER NOT NULL DEFAULT 1,
                security_alerts INTEGER NOT NULL DEFAULT 1,
                product_updates INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_notifications_user_created
            ON notifications (user_id, created_at)
        """)


init_notification_db()

def add_audit_log(
    action,
    entity_type,
    entity_id="",
    details="",
    user_id=None
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        conn.execute(
            f"""
            INSERT INTO audit_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                details,
                created_at
            )
            VALUES ({', '.join([placeholder] * 6)})
            """,
            (
                user_id,
                action,
                entity_type,
                str(entity_id),
                details,
                datetime.utcnow().isoformat()
            )
        )


def create_notification(user_id, title, message, category="general", priority="normal"):
    placeholder = get_placeholder()

    preference_fields = {
        "review": "review_alerts",
        "evidence": "evidence_alerts",
        "security": "security_alerts",
        "product_update": "product_updates",
        "product_updates": "product_updates",
    }

    with get_connection() as conn:

        # Get the user's notification preferences
        preferences = conn.execute(
            f"""
            SELECT
                in_app_enabled,
                review_alerts,
                evidence_alerts,
                security_alerts,
                product_updates
            FROM notification_preferences
            WHERE user_id = {placeholder}
            """,
            (user_id,)
        ).fetchone()

        # Stop if in-app notifications are disabled
        if preferences is not None:
            if not bool(preferences["in_app_enabled"]):
                return

            # Check the preference for this notification category
            preference_field = preference_fields.get(
                (category or "general").lower()
            )

            if preference_field:
                if not bool(preferences[preference_field]):
                    return

        # Create notification only when enabled
        conn.execute(
            f"""
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                category,
                priority,
                is_read,
                created_at
            )
            VALUES ({', '.join([placeholder] * 7)})
            """,
            (
                user_id,
                title,
                message,
                category,
                priority,
                0,
                datetime.utcnow().isoformat()
            )
        )


@app.get("/notifications")
def get_notifications(
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()
    limit = max(1, min(limit, 100))

    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT id, title, message, category, priority,
                   is_read, created_at, read_at
            FROM notifications
            WHERE user_id = {placeholder}
            ORDER BY created_at DESC
            LIMIT {placeholder}
            """,
            (user["id"], limit)
        ).fetchall()

    return [dict(row) for row in rows]


@app.get("/notifications/unread-count")
def get_unread_notification_count(
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        row = conn.execute(
            f"""
            SELECT COUNT(*) AS unread_count
            FROM notifications
            WHERE user_id = {placeholder}
              AND is_read = 0
            """,
            (user["id"],)
        ).fetchone()

    return {"unread_count": row["unread_count"]}


@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        result = conn.execute(
            f"""
            UPDATE notifications
            SET is_read = 1, read_at = {placeholder}
            WHERE id = {placeholder}
              AND user_id = {placeholder}
            """,
            (
                datetime.utcnow().isoformat(),
                notification_id,
                user["id"]
            )
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Notification not found."
            )

    return {"message": "Notification marked as read."}


@app.patch("/notifications/read-all")
def mark_all_notifications_read(
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        conn.execute(
            f"""
            UPDATE notifications
            SET is_read = 1, read_at = {placeholder}
            WHERE user_id = {placeholder}
              AND is_read = 0
            """,
            (
                datetime.utcnow().isoformat(),
                user["id"]
            )
        )

    return {"message": "All notifications marked as read."}

@app.get("/notification-preferences")
def get_notification_preferences(
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        row = conn.execute(
            f"""
            SELECT
                in_app_enabled,
                email_enabled,
                browser_enabled,
                review_alerts,
                evidence_alerts,
                security_alerts,
                product_updates
            FROM notification_preferences
            WHERE user_id = {placeholder}
            """,
            (user["id"],)
        ).fetchone()

        if row is None:
            return {
                "in_app_enabled": True,
                "email_enabled": False,
                "browser_enabled": False,
                "review_alerts": True,
                "evidence_alerts": True,
                "security_alerts": True,
                "product_updates": False
            }

    preferences = dict(row)

    return {
        key: bool(value)
        for key, value in preferences.items()
    }

@app.put("/notification-preferences")
def update_notification_preferences(
    preferences: dict,
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    allowed_fields = {
        "in_app_enabled",
        "email_enabled",
        "browser_enabled",
        "review_alerts",
        "evidence_alerts",
        "security_alerts",
        "product_updates"
    }

    defaults = {
        "in_app_enabled": True,
        "email_enabled": False,
        "browser_enabled": False,
        "review_alerts": True,
        "evidence_alerts": True,
        "security_alerts": True,
        "product_updates": False
    }

    unknown_fields = set(preferences.keys()) - allowed_fields

    if unknown_fields:
        raise HTTPException(
        status_code=400,
        detail=f"Invalid preference fields: {list(unknown_fields)}"
    )

    invalid_values = {
        key: value
        for key, value in preferences.items()
        if not isinstance(value, bool)
    }

    if invalid_values:
        raise HTTPException(
        status_code=400,
        detail=f"Preference values must be true or false: {invalid_values}"
    )

    values = {
        key: preferences.get(key, default)
        for key, default in defaults.items()
    }

    with get_connection() as conn:
        existing = conn.execute(
            f"""
            SELECT user_id
            FROM notification_preferences
            WHERE user_id = {placeholder}
            """,
            (user["id"],)
        ).fetchone()

        if existing:
            conn.execute(
                f"""
                UPDATE notification_preferences
                SET
                    in_app_enabled = {placeholder},
                    email_enabled = {placeholder},
                    browser_enabled = {placeholder},
                    review_alerts = {placeholder},
                    evidence_alerts = {placeholder},
                    security_alerts = {placeholder},
                    product_updates = {placeholder},
                    updated_at = {placeholder}
                WHERE user_id = {placeholder}
                """,
                (
                    int(values["in_app_enabled"]),
                    int(values["email_enabled"]),
                    int(values["browser_enabled"]),
                    int(values["review_alerts"]),
                    int(values["evidence_alerts"]),
                    int(values["security_alerts"]),
                    int(values["product_updates"]),
                    datetime.utcnow().isoformat(),
                    user["id"]
                )
            )
        else:
            conn.execute(
                f"""
                INSERT INTO notification_preferences (
                    user_id,
                    in_app_enabled,
                    email_enabled,
                    browser_enabled,
                    review_alerts,
                    evidence_alerts,
                    security_alerts,
                    product_updates,
                    updated_at
                )
                VALUES ({', '.join([placeholder] * 9)})
                """,
                (
                    user["id"],
                    int(values["in_app_enabled"]),
                    int(values["email_enabled"]),
                    int(values["browser_enabled"]),
                    int(values["review_alerts"]),
                    int(values["evidence_alerts"]),
                    int(values["security_alerts"]),
                    int(values["product_updates"]),
                    datetime.utcnow().isoformat()
                )
            )

    return {
        "message": "Notification preferences saved successfully."
    }


class ContentReviewRequest(BaseModel):
    guideline_id: int
    content: str


@app.get("/")
def home():
    return {
        "message": "Welcome to VARIETY AI",
        "description": "Your intelligent brand governance platform is running."
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "VARIETY AI Backend",
        "version": "2.0.0",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/upload-guidelines")
async def upload_guidelines(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    filename = file.filename or ""
    extension = filename.lower().rsplit(".", 1)[-1]

    if extension not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_content = await file.read()

    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 10 MB."
        )

    try:
        if extension == "pdf":
            pdf = fitz.open(
                stream=file_content,
                filetype="pdf"
            )

            extracted_text = "\n".join(
                page.get_text() for page in pdf
            )

            pdf.close()

        else:
            document = Document(BytesIO(file_content))

            extracted_text = "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
            )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this document. Please check the file."
        )

    # PostgreSQL-compatible database insertion
    with get_connection() as conn:
        
        cursor = conn.execute(
            f"""
            INSERT INTO brand_guidelines
            (filename, file_type, extracted_text, uploaded_at, user_id)
            VALUES ({', '.join([get_placeholder()] * 5)})
            RETURNING id
            """,
           (
                filename,
                extension,
                extracted_text,
                datetime.now().isoformat(),
                current_user["id"]
            )
        )


    inserted_row = cursor.fetchone()

    guideline_id = (
        inserted_row["id"]
        if isinstance(inserted_row, dict)
        else inserted_row[0]
    )

    return {
        "message": "Guidelines uploaded and text extracted successfully.",
        "guideline_id": guideline_id,
        "filename": filename,
        "file_type": extension,
        "character_count": len(extracted_text),
        "extracted_text": extracted_text
    }
@app.get("/guidelines")
def get_guidelines(current_user: dict = Depends(get_current_user)):

    with get_connection() as conn:
        
        rows = conn.execute(
            f"""
            SELECT id, filename, file_type, extracted_text, uploaded_at
            FROM brand_guidelines
            WHERE user_id = {get_placeholder()}
            ORDER BY id DESC
            """,
            (current_user["id"],)
        ).fetchall()


        return {
            "total_guidelines": len(rows),
            "guidelines": [dict(row) for row in rows]
        }



@app.get("/reviews")
def get_reviews(current_user: dict = Depends(get_current_user)):
    try:
        placeholder = get_placeholder()

        with get_connection() as conn:
            rows = conn.execute(
                f"""
                SELECT
                    id,
                    guideline_id,
                    guideline_filename,
                    content,
                    review_status,
                    total_violations,
                    risk_high,
                    risk_medium,
                    risk_low,
                    findings,
                    reviewed_at,
                    engine_version
                FROM reviews
                WHERE user_id = {placeholder}
                ORDER BY id DESC
                """,
                (current_user["id"],)
            ).fetchall()

        reviews = []

        for row in rows:
            review = dict(row)
            findings_text = review.get("findings")

            if findings_text:
                try:
                    review["findings"] = json.loads(findings_text)
                except (json.JSONDecodeError, TypeError):
                    review["findings"] = []
            else:
                review["findings"] = []

            reviews.append(review)

        return {
            "reviews": reviews,
            "total": len(reviews)
        }

    except Exception as e:
        print(f"ERROR in /reviews: {repr(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unable to load reviews: {str(e)}"
        )




@app.get("/reviews/{review_id}")
def get_review(
    review_id: int,
    current_user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        # STEP 1: Verify review ownership.
        review = conn.execute(
            f"""
            SELECT *
            FROM reviews
            WHERE id = {placeholder}
              AND user_id = {placeholder}
            """,
            (review_id, current_user["id"])
        ).fetchone()

        if review is None:
            raise HTTPException(
                status_code=404,
                detail="Review not found."
            )

        # STEP 2: Retrieve findings only for the authorized review.
        findings = conn.execute(
            f"""
            SELECT *
            FROM review_findings
            WHERE review_id = {placeholder}
              AND EXISTS (
                  SELECT 1
                  FROM reviews
                  WHERE reviews.id = review_findings.review_id
                    AND reviews.user_id = {placeholder}
              )
            ORDER BY id
            """,
            (review_id, current_user["id"])
        ).fetchall()

    return {
        "review": dict(review),
        "findings": [dict(row) for row in findings]
    }


class GovernanceRequest(BaseModel):
    review_id: Optional[int] = None
    title: str
    severity: str = "MEDIUM"
    assigned_to: str = ""
    due_date: str = ""


@app.post("/governance")
def create_governance_item(
    request: GovernanceRequest,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.utcnow().isoformat()
    placeholder = get_placeholder()

    with get_connection() as conn:

        # STEP 1: Verify that the review belongs to the logged-in user.
        review = conn.execute(
            f"""
            SELECT id
            FROM reviews
            WHERE id = {placeholder}
              AND user_id = {placeholder}
            """,
            (
                request.review_id,
                current_user["id"]
            )
        ).fetchone()

        if review is None:
            raise HTTPException(
                status_code=404,
                detail="Review not found or you do not have permission to access it."
            )

        # STEP 2: Insert the governance record with user ownership.
        cursor = conn.execute(
            f"""
            INSERT INTO governance_items
            (
                user_id,
                review_id,
                title,
                severity,
                status,
                assigned_to,
                due_date,
                created_at,
                updated_at
            )
            VALUES (
                {placeholder},
                {placeholder},
                {placeholder},
                {placeholder},
                'PENDING',
                {placeholder},
                {placeholder},
                {placeholder},
                {placeholder}
            )
            RETURNING id
            """,
            (
                current_user["id"],
                request.review_id,
                request.title,
                request.severity,
                request.assigned_to,
                request.due_date,
                now,
                now
            )
        )

        # STEP 3: Retrieve the newly created record ID.
        inserted_row = cursor.fetchone()

        item_id = (
            inserted_row["id"]
            if isinstance(inserted_row, dict)
            else inserted_row[0]
        )

    # STEP 4: Preserve your existing audit log.
    add_audit_log(
    "Governance item created",
    "governance",
    item_id,
    request.title,
    user_id=current_user["id"]
)

    return {
        "success": True,
        "id": item_id,
        "message": "Governance item created."
    }


@app.get("/governance")
def get_governance(
    current_user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT *
            FROM governance_items
            WHERE user_id = {placeholder}
            ORDER BY id DESC
            """,
            (current_user["id"],)
        ).fetchall()

    return {
        "total": len(rows),
        "items": [dict(row) for row in rows]
    }

class GovernanceStatusRequest(BaseModel):
    status: str


@app.put("/governance/{governance_id}")
def update_governance_status(
    governance_id: int,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    allowed_statuses = {
        "OPEN",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
        "RESOLVED"
    }

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid governance status: {status}"
        )

    placeholder = get_placeholder()

    with get_connection() as conn:
        cursor = conn.execute(
            f"""
            UPDATE governance_items
            SET status = {placeholder},
                updated_at = {placeholder}
            WHERE id = {placeholder}
              AND user_id = {placeholder}
            """,
            (
                status,
                datetime.now().isoformat(),
                governance_id,
                current_user["id"]
            )
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Governance record not found or you do not have permission to update it."
            )

    return {
        "message": "Governance status updated",
        "id": governance_id,
        "status": status
    }



@app.patch("/governance/{item_id}/status")
def update_governance_status(
    item_id: int,
    request: GovernanceStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    allowed = {
        "PENDING",
        "APPROVED",
        "REJECTED",
        "RESOLVED",
        "REVISION_REQUIRED"
    }

    if request.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Invalid governance status."
        )

    now = datetime.utcnow().isoformat()
    placeholder = get_placeholder()

    with get_connection() as conn:
        cursor = conn.execute(
            f"""
            UPDATE governance_items
            SET status = {placeholder},
                updated_at = {placeholder}
            WHERE id = {placeholder}
              AND user_id = {placeholder}
            """,
            (
                request.status,
                now,
                item_id,
                current_user["id"]
            )
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Governance item not found or you do not have permission to update it."
            )

    add_audit_log(
    f"Governance status changed to {request.status}",
    "governance",
    item_id,
    user_id=current_user["id"]
)

    return {
        "success": True,
        "status": request.status
    }


@app.get("/audit-logs")
def get_audit_logs(
    current_user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT *
            FROM audit_logs
            WHERE user_id = {placeholder}
            ORDER BY id DESC
            LIMIT 200
            """,
            (current_user["id"],)
        ).fetchall()

    return {
        "total": len(rows),
        "logs": [dict(row) for row in rows]
    }

@app.get("/database-status")
def database_status(current_user: dict = Depends(get_current_user)):

    with get_connection() as conn:

        if is_postgres():
            rows = conn.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """).fetchall()

            tables = [row["table_name"] for row in rows]

        else:
            rows = conn.execute("""
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                ORDER BY name
            """).fetchall()

            tables = [row["name"] for row in rows]

    return {
        "database": "PostgreSQL" if is_postgres() else str(DB_PATH),
        "status": "connected",
        "tables": tables
    }

@app.get("/analytics")
def get_analytics(current_user: dict = Depends(get_current_user)):
    try:
        placeholder = get_placeholder()

        with get_connection() as conn:

            review_stats = conn.execute(
                f"""
                SELECT
                    COUNT(*) AS total_reviews,
                    COALESCE(SUM(
                        CASE WHEN review_status = 'HIGH_RISK'
                        THEN 1 ELSE 0 END
                    ), 0) AS high_risk_reviews,
                    COALESCE(SUM(
                        CASE WHEN review_status = 'NEEDS_REVISION'
                        THEN 1 ELSE 0 END
                    ), 0) AS revision_reviews,
                    COALESCE(SUM(
                        CASE WHEN review_status = 'COMPLIANT'
                        THEN 1 ELSE 0 END
                    ), 0) AS compliant_reviews,
                    COALESCE(SUM(total_violations), 0)
                    AS total_violations
                FROM reviews
                WHERE user_id = {placeholder}
                """,
                (current_user["id"],)
            ).fetchone()

            risk_stats = conn.execute(
                f"""
                SELECT
                    COALESCE(SUM(risk_high), 0) AS high,
                    COALESCE(SUM(risk_medium), 0) AS medium,
                    COALESCE(SUM(risk_low), 0) AS low
                FROM reviews
                WHERE user_id = {placeholder}
                """,
                (current_user["id"],)
            ).fetchone()

        return {
            "total_reviews": review_stats["total_reviews"] or 0,
            "high_risk_reviews": review_stats["high_risk_reviews"] or 0,
            "revision_reviews": review_stats["revision_reviews"] or 0,
            "compliant_reviews": review_stats["compliant_reviews"] or 0,
            "total_violations": review_stats["total_violations"] or 0,
            "risk_summary": {
                "high": risk_stats["high"] or 0,
                "medium": risk_stats["medium"] or 0,
                "low": risk_stats["low"] or 0
            }
        }

    except Exception as e:
        print(f"ERROR in /analytics: {repr(e)}")

        raise HTTPException(
            status_code=500,
            detail=f"Unable to load analytics: {str(e)}"
        )



@app.post("/review-content")
def review_content(request: ContentReviewRequest,current_user: dict = Depends(get_current_user)):
    # Find the selected brand guidelines
    with get_connection() as conn:
        row = conn.execute(
            f"""
            SELECT filename, extracted_text
            FROM brand_guidelines
            WHERE id = {get_placeholder()}
            AND user_id = {get_placeholder()}
            """,
            (request.guideline_id,
             current_user["id"])
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Guideline ID not found."
        )

    filename = row['filename']
    guideline_text = row['extracted_text']
    content = request.content

    # Define brand rules
        # =========================================
    # VARIETY AI RULE ENGINE
    # =========================================

    rules = [
        {
            "name": "Employment guarantee",
            "patterns": [
                r"guarantee.{0,40}job",
                r"job.{0,40}guarantee",
                r"guaranteed.{0,40}employment",
                r"guaranteed.{0,40}placement",
            ],
            "guideline_keywords": [
                "guarantees a job",
                "job guarantee",
                "guaranteed employment",
                "guaranteed placement",
            ],
            "severity": "HIGH",
            "category": "Claims",
            "suggestion": (
                "Remove the employment guarantee unless "
                "official evidence supports the claim."
            ),
        },

        {
            "name": "Unsupported government approval",
            "patterns": [
                r"government[- ]approved",
                r"government[- ]certified",
                r"approved by the government",
            ],
            "guideline_keywords": [
                "government-approved",
                "government approved",
                "government-certified",
            ],
            "severity": "HIGH",
            "category": "Claims",
            "suggestion": (
                "Remove the government approval claim unless "
                "official approval evidence exists."
            ),
        },

        {
            "name": "Unsupported university certification",
            "patterns": [
                r"university[- ]certified",
                r"certified by the university",
                r"university[- ]approved",
            ],
            "guideline_keywords": [
                "university-certified",
                "university certified",
                "university-approved",
            ],
            "severity": "HIGH",
            "category": "Claims",
            "suggestion": (
                "Use approved certification language only when "
                "the university relationship and certification are verified."
            ),
        },

        {
            "name": "Exaggerated expertise claim",
            "patterns": [
                r"instant expertise",
                r"become an expert instantly",
                r"expert in minutes",
                r"master anything instantly",
            ],
            "guideline_keywords": [
                "instant expertise",
                "instant expert",
                "expert in minutes",
            ],
            "severity": "MEDIUM",
            "category": "Messaging",
            "suggestion": (
                "Replace exaggerated expertise language with "
                "more realistic language such as 'build practical skills'."
            ),
        },

        {
            "name": "Unapproved terminology",
            "patterns": [
                r"weak candidates",
                r"bad candidates",
                r"poor candidates",
                r"low-quality candidates",
            ],
            "guideline_keywords": [
                "weak candidates",
                "bad candidates",
                "poor candidates",
            ],
            "severity": "MEDIUM",
            "category": "Language",
            "suggestion": (
                "Use respectful, approved terminology such as 'learners' "
                "or the terminology defined in the brand guidelines."
            ),
        },

        {
            "name": "Absolute outcome claim",
            "patterns": [
                r"always guarantees",
                r"100% success",
                r"guaranteed success",
                r"zero risk",
                r"no risk",
            ],
            "guideline_keywords": [
                "guaranteed success",
                "100% success",
                "absolute claims",
                "guarantees outcomes",
            ],
            "severity": "HIGH",
            "category": "Claims",
            "suggestion": (
                "Avoid absolute outcome claims unless they are "
                "supported by approved evidence."
            ),
        },

        {
            "name": "Unverifiable superlative",
            "patterns": [
                r"best in the world",
                r"number one",
                r"#1",
                r"the world's best",
                r"industry-leading",
            ],
            "guideline_keywords": [
                "best in the world",
                "number one",
                "world's best",
                "industry-leading",
                "unsupported superlatives",
            ],
            "severity": "MEDIUM",
            "category": "Claims",
            "suggestion": (
                "Replace unsupported superlatives with a specific, "
                "verifiable statement."
            ),
        },
    ]

    findings = []

    findings = []
    content_lower = content.lower()
    guideline_lower = guideline_text.lower()

    for rule in rules:

        # Check whether this rule is relevant to the
        # uploaded brand guideline.
        rule_exists = any(
            keyword.lower() in guideline_lower
            for keyword in rule["guideline_keywords"]
        )

        if not rule_exists:
            continue

        # Check submitted content against every pattern.
        for pattern in rule["patterns"]:

            match = re.search(
                pattern,
                content,
                re.IGNORECASE
            )

            if match:

                detected_text = match.group()

                findings.append({
                    "rule": rule["name"],
                    "category": rule["category"],
                    "severity": rule["severity"],
                    "detected_text": detected_text,
                    "explanation": (
                        f"The content contains language that conflicts "
                        f"with the uploaded brand guideline."
                    ),
                    "suggestion": rule["suggestion"],
                })

                break

    # Determine review status
    # =========================================
    # REVIEW SUMMARY
    # =========================================

    high_risk_count = sum(
        1 for finding in findings
        if finding["severity"] == "HIGH"
    )

    medium_risk_count = sum(
        1 for finding in findings
        if finding["severity"] == "MEDIUM"
    )

    low_risk_count = sum(
        1 for finding in findings
        if finding["severity"] == "LOW"
    )

    if high_risk_count > 0:
        status = "HIGH_RISK"
    elif medium_risk_count > 0:
        status = "NEEDS_REVISION"
    else:
        status = "COMPLIANT"

    review_uuid = str(uuid.uuid4())

    high_count = sum(
        1 for finding in findings
        if finding.get("severity") == "HIGH"
    )

    medium_count = sum(
        1 for finding in findings
        if finding.get("severity") == "MEDIUM"
    )

    low_count = sum(
        1 for finding in findings
        if finding.get("severity") == "LOW"
    )

    review_status = (
        "HIGH_RISK"
        if high_count > 0
        else "NEEDS_REVISION"
        if len(findings) > 0
        else "COMPLIANT"
    )

    with get_connection() as conn:
        
        cursor = conn.execute(
            f"""
            INSERT INTO reviews
            (
                user_id,
                guideline_id,
                guideline_filename,
                content,
                review_status,
                total_violations,
                risk_high,
                risk_medium,
                risk_low,
                findings,
                reviewed_at,
                engine_version
            )
            VALUES ({', '.join([get_placeholder()] * 12)})
            RETURNING id
            """,
            (
                current_user["id"],
                request.guideline_id,
                filename,
                content,
                review_status,
                len(findings),
                high_count,
                medium_count,
                low_count,
                json.dumps(findings),
                datetime.utcnow().isoformat(),
                "2.0"
            )
        )

        inserted_row = cursor.fetchone()
        review_id = inserted_row["id"] if isinstance(inserted_row, dict) else inserted_row[0]

        for finding in findings:
            conn.execute(
                f"""
                INSERT INTO review_findings
                (
                    review_id,
                    category,
                    severity,
                    detected_text,
                    explanation,
                    suggestion,
                    confidence
                )
                VALUES ({', '.join([get_placeholder()] * 7)})
                """,
                (
                    review_id,
                    finding.get("category", finding.get("name", "General")),
                    finding.get("severity", "LOW"),
                    finding.get("detected_text", ""),
                    finding.get("explanation", ""),
                    finding.get("suggestion", ""),
                    finding.get("confidence", 90)
                )
            )
    add_audit_log(
    "Review completed",
    "review",
    review_id,
    f"Status: {review_status}",
    user_id=current_user["id"]
)
    # Generate an in-app notification after successful review

    if high_count > 0:
        notification_title = "High-Risk Content Detected"
        notification_message = (
            f"Your AI review is complete. "
            f"{high_count} high-risk issue(s) detected. "
            f"Review ID: {review_id}."
        )
        notification_priority = "high"

    elif len(findings) > 0:
        notification_title = "AI Review Completed"
        notification_message = (
            f"Your AI review is complete. "
            f"{len(findings)} issue(s) detected. "
            f"Review ID: {review_id}."
        )
        notification_priority = "normal"

    else:
        notification_title = "Content Passed AI Review"
        notification_message = (
            f"Your content passed the review checks. "
            f"Review ID: {review_id}."
        )
        notification_priority = "normal"

    create_notification(
        user_id=current_user["id"],
        title=notification_title,
        message=notification_message,
        category="review",
        priority=notification_priority
    )

    return {
        "message": "VARIETY AI content review completed.",
        "guideline_id": request.guideline_id,
        "guideline_filename": filename,
        "review_status": review_status,
        "total_violations": len(findings),
        "risk_summary": {
            "high": high_risk_count,
            "medium": medium_risk_count,
            "low": low_risk_count,
        },
        "findings": findings,
        "reviewed_content": content,
        "review_type": "VARIETY AI Rule Intelligence Engine",
        "engine_version": "2.0",
    }
