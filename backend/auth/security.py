"""Password hashing (stdlib PBKDF2) + JWT helpers for custom email/password auth."""

import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

from config import settings

_ALGO = "HS256"
_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_b64, hash_b64 = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iters))
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def create_access_token(user_id: str, extra: dict | None = None, days: int = 30) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=days)}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_ALGO)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGO])
    except JWTError:
        return None


def make_reset_token(hours: int = 1) -> tuple[str, str, datetime]:
    """Return (raw_token, token_hash, expires_at). Only the hash is stored."""
    token = secrets.token_urlsafe(32)
    return token, hash_reset_token(token), datetime.now(timezone.utc) + timedelta(hours=hours)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def is_admin_email(email: str | None) -> bool:
    if not email:
        return False
    admins = {e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()}
    return email.lower() in admins
