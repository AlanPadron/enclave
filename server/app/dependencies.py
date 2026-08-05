"""Shared FastAPI dependencies — auth."""
from fastapi import Header, HTTPException, status

from app.models.user import User, store as users
from app.services.auth import decode_token
from app.services.validation import extract_bearer


def current_user(authorization: str | None = Header(default=None)) -> User:
    token = extract_bearer(authorization)
    if not token:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "sesión no iniciada — inicia sesión de nuevo",
        )
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "sesión inválida o expirada — vuelve a iniciar sesión",
        )
    user = users.find_by_id(payload["sub"])
    if not user:
        # Token is signed correctly but the user no longer exists in the
        # in-memory store. This happens after a server restart that wiped
        # the user table — the user's old JWT is still cryptographically
        # valid, but it points to a user that isn't here anymore.
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "tu sesión ya no es válida (el servidor se reinició) — inicia sesión de nuevo",
        )
    return user
