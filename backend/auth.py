import os
import re
import sqlite3
from datetime import datetime, timedelta, timezone
import uuid

from fastapi import Request
from typing import Optional

import jwt
import psycopg
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from pwdlib import PasswordHash

from backend.database import get_connection, get_placeholder


JWT_SECRET = os.getenv("VARIETY_JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 30

if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError(
        "Set VARIETY_JWT_SECRET to a secret of at least 32 characters "
        "before starting the backend."
    )

router = APIRouter(prefix="/auth", tags=["Authentication"])
password_hasher = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=128)


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
        max_length=128
    )
    new_password: str = Field(
        min_length=12,
        max_length=128
    )




def get_placeholder():
    return "%s" if os.getenv("DATABASE_URL") else "?"

def init_auth_sessions():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS auth_sessions (
                jti TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked_at TEXT,
                user_agent TEXT,
                ip_address TEXT
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
            ON auth_sessions (user_id)
        """)


init_auth_sessions()


def normalize_email(email: str) -> str:
    email = email.strip().lower()

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(
            status_code=422,
            detail="Enter a valid email address.",
        )

    return email


def create_access_token(user_id: int, session_id: str) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "jti": session_id,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):
    email = normalize_email(data.email)
    name = data.name.strip()

    if not name:
        raise HTTPException(status_code=422, detail="Name is required.")

    password_hash = password_hasher.hash(data.password)
    placeholder = get_placeholder()

    try:
        with get_connection() as conn:
            user = conn.execute(
                f"""
                INSERT INTO users (name, email, password_hash, role, created_at)
                VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
                RETURNING id
                """,
                (
                    name,
                    email,
                    password_hash,
                    "Reviewer",
                    datetime.now(timezone.utc).isoformat(),
                ),
            ).fetchone()

            user_id = user["id"]

    except (sqlite3.IntegrityError, psycopg.IntegrityError):
        raise HTTPException(
            status_code=409,
            detail="An account with this email may already exist.",
        )

    return {
        "id": user_id,
        "name": name,
        "email": email,
        "role": "Reviewer",
        "message": "Registration successful. Please log in.",
    }


@router.post("/login")
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends()
):
    email = normalize_email(form.username)
    placeholder = get_placeholder()

    with get_connection() as conn:
        user = conn.execute(
            f"""
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = {placeholder}
            """,
            (email,),
        ).fetchone()

    if not user or not password_hasher.verify(
        form.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    session_id = str(uuid.uuid4())
    expires_at = now + timedelta(minutes=ACCESS_TOKEN_MINUTES)

    access_token = create_access_token(
        user["id"],
        session_id
    )

    with get_connection() as conn:
        conn.execute(
            f"""
            INSERT INTO auth_sessions
            (
                jti,
                user_id,
                created_at,
                expires_at,
                user_agent,
                ip_address
            )
            VALUES (
                {placeholder},
                {placeholder},
                {placeholder},
                {placeholder},
                {placeholder},
                {placeholder}
            )
            """,
            (
                session_id,
                user["id"],
                now.isoformat(),
                expires_at.isoformat(),
                request.headers.get("user-agent", "")[:500],
                request.client.host if request.client else None
            )
        )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_MINUTES * 60,
    }


def get_current_user(token: str = Depends(oauth2_scheme)):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "jti"]},
        )

        user_id = int(payload["sub"])
        session_id = payload["jti"]

    except (jwt.InvalidTokenError, ValueError, TypeError, KeyError):
        raise unauthorized

    placeholder = get_placeholder()

    with get_connection() as conn:
        session = conn.execute(
            f"""
            SELECT jti
            FROM auth_sessions
            WHERE jti = {placeholder}
              AND user_id = {placeholder}
              AND revoked_at IS NULL
            """,
            (session_id, user_id),
        ).fetchone()

        if session is None:
            raise unauthorized

        user = conn.execute(
            f"""
            SELECT id, name, email, role, created_at
            FROM users
            WHERE id = {placeholder}
            """,
            (user_id,),
        ).fetchone()

    if user is None:
        raise unauthorized

    return {
        **dict(user),
        "_session_jti": session_id,
    }


@router.get("/sessions")
def get_active_sessions(
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT
                created_at,
                expires_at,
                user_agent,
                ip_address,
                jti
            FROM auth_sessions
            WHERE user_id = {placeholder}
              AND revoked_at IS NULL
              AND (
                  expires_at > {placeholder}
                  OR jti = {placeholder}
              )
            ORDER BY created_at DESC
            """,
            (user["id"], now, user["_session_jti"])
        ).fetchall()

    return {
        "sessions": [
            {
                "created_at": row["created_at"],
                "expires_at": row["expires_at"],
                "user_agent": row["user_agent"],
                "ip_address": row["ip_address"],
                "is_current": (
                    row["jti"] == user["_session_jti"]
                )
            }
            for row in rows
        ]
    }



@router.post("/logout")
def logout(
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        conn.execute(
            f"""
            UPDATE auth_sessions
            SET revoked_at = {placeholder}
            WHERE jti = {placeholder}
              AND user_id = {placeholder}
              AND revoked_at IS NULL
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                user["_session_jti"],
                user["id"]
            )
        )

    return {
        "message": "Session signed out successfully."
    }


@router.post("/sessions/revoke-others")
def revoke_other_sessions(
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:
        conn.execute(
            f"""
            UPDATE auth_sessions
            SET revoked_at = {placeholder}
            WHERE user_id = {placeholder}
              AND jti != {placeholder}
              AND revoked_at IS NULL
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                user["id"],
                user["_session_jti"]
            )
        )

    return {
        "message": "Other active sessions have been signed out."
    }
@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user["created_at"]
    }

@router.patch("/me")
def update_me(
    data: ProfileUpdateRequest,
    user: dict = Depends(get_current_user)
):
    if data.name is None and data.email is None:
        raise HTTPException(
            status_code=400,
            detail="Provide a name or email address to update."
        )

    name = (
        data.name.strip()
        if data.name is not None
        else user["name"]
    )

    email = (
        normalize_email(data.email)
        if data.email is not None
        else user["email"]
    )

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Name cannot be empty."
        )

    placeholder = get_placeholder()

    try:
        with get_connection() as conn:
            conn.execute(
                f"""
                UPDATE users
                SET name = {placeholder},
                    email = {placeholder}
                WHERE id = {placeholder}
                """,
                (name, email, user["id"])
            )

            updated_user = conn.execute(
                f"""
                SELECT id, name, email, role, created_at
                FROM users
                WHERE id = {placeholder}
                """,
                (user["id"],)
            ).fetchone()

    except (sqlite3.IntegrityError, psycopg.IntegrityError):
        raise HTTPException(
            status_code=409,
            detail="This email address is already registered."
        )

    return dict(updated_user)

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    user: dict = Depends(get_current_user)
):
    placeholder = get_placeholder()

    with get_connection() as conn:

        account = conn.execute(
            f"""
            SELECT password_hash
            FROM users
            WHERE id = {placeholder}
            """,
            (user["id"],)
        ).fetchone()

        if account is None:
            raise HTTPException(
                status_code=404,
                detail="User account not found."
            )

        # Verify the current password
        if not password_hasher.verify(
            data.current_password,
            account["password_hash"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Your current password is incorrect."
            )

        # Prevent reusing the current password
        if password_hasher.verify(
            data.new_password,
            account["password_hash"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Your new password must be different."
            )

        # Hash and save the new password
        new_password_hash = password_hasher.hash(
            data.new_password
        )

        conn.execute(
            f"""
            UPDATE users
            SET password_hash = {placeholder}
            WHERE id = {placeholder}
            """,
            (new_password_hash, user["id"])
        )

    return {
        "message": "Password changed successfully."
    }
def require_roles(*allowed_roles: str):
    def role_checker(user: dict = Depends(get_current_user)):
        if user["role"].casefold() not in {
            role.casefold() for role in allowed_roles
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        return user

    return role_checker
