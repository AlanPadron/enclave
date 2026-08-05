"""Auth routes: register, login, me."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import current_user
from app.models.user import User, UserStore, store as users
from app.services.auth import hash_password, issue_token, verify_password
from app.services.validation import valid_password, valid_username

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(body: dict):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not valid_username(username):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "username inválido (3-24 chars, letras/números/._-)",
        )
    if not valid_password(password):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "password inválido (6-128 chars, sin espacios)",
        )
    if users.find_by_username(username):
        raise HTTPException(status.HTTP_409_CONFLICT, "username taken")
    user = users.create(username=username, password_hash=hash_password(password))
    return {"token": issue_token(user.id, user.username), "user": UserStore.public_profile(user)}


@router.post("/login")
async def login(body: dict):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "username y password requeridos",
        )
    user = users.find_by_username(username)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    return {"token": issue_token(user.id, user.username), "user": UserStore.public_profile(user)}


@router.get("/me")
async def me(user: User = Depends(current_user)):
    return {"user": UserStore.public_profile(user)}
