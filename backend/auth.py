
import os
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from pwdlib import PasswordHash


# Reuse the existing database in the project root.
DB_PATH = Path(__file__).resolve().parent.parent / "verity.db"

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


def get_connection():
    if not DB_PATH.is_file():
        raise RuntimeError(f"Existing database not found: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def normalize_email(email: str) -> str:
    email = email.strip().lower()

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(
            status_code=422,
            detail="Enter a valid email address.",
        )

    return email


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):
    email = normalize_email(data.email)
    name = data.name.strip()

    if not name:
        raise HTTPException(status_code=422, detail="Name is required.")

    # Public registration must never allow self-assigned admin roles.
    password_hash = password_hasher.hash(data.password)

    try:
        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    name,
                    email,
                    password_hash,
                    "Reviewer",
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            user_id = cursor.lastrowid

    except sqlite3.IntegrityError:
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
def login(form: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm uses the field named "username".
    # For this application, users enter their email in that field.
    email = normalize_email(form.username)

    with get_connection() as conn:
        user = conn.execute(
            """
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

    if not user or not password_hasher.verify(
        form.password, user["password_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(user["id"]),
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
            options={"require": ["sub", "exp"]},
        )
        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, ValueError, TypeError, KeyError):
        raise unauthorized

    with get_connection() as conn:
        user = conn.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()

    if user is None:
        raise unauthorized

    return dict(user)


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return user


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
