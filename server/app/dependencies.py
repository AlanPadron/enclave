"""Shared FastAPI dependencies — auth."""
from fastapi import Header, HTTPException, status

from app.models.user import User, store as users
from app.services.auth import decode_token
from app.services.validation import extract_bearer


def current_user(authorization: str | None = Header(default=None)) -> User:
    token = extract_bearer(authorization)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="no token")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="bad token")
    user = users.find_by_id(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="invalid user")
    return user
