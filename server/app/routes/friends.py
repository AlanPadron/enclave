"""Friends routes: list, request, accept, reject."""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import current_user
from app.models.user import User, UserStore, store as users
from app.services.validation import valid_username

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("")
async def list_friends(user: User = Depends(current_user)):
    return {
        "friends": [UserStore.public_profile(u) for u in users.find_many_by_ids(user.friends)],
        "incoming": [UserStore.public_profile(u) for u in users.find_many_by_ids(user.incoming)],
        "outgoing": [UserStore.public_profile(u) for u in users.find_many_by_ids(user.outgoing)],
    }


@router.post("/request")
async def send_request(body: dict, user: User = Depends(current_user)):
    username = (body.get("username") or "").strip()
    if not valid_username(username):
        raise HTTPException(400, "username inválido")
    target = users.find_by_username(username)
    if not target:
        raise HTTPException(404, "user not found")
    if target.id == user.id:
        raise HTTPException(400, "self")
    return {"result": users.send_request(user.id, target.id)}


@router.post("/accept")
async def accept(body: dict, user: User = Depends(current_user)):
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        raise HTTPException(400, "userId required")
    return {"result": users.accept_request(user.id, user_id)}


@router.post("/reject")
async def reject(body: dict, user: User = Depends(current_user)):
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        raise HTTPException(400, "userId required")
    return {"result": users.reject_request(user.id, user_id)}
