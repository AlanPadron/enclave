"""Channel routes: list channels, fetch message history."""
from fastapi import APIRouter, Depends, Query

from app.dependencies import current_user
from app.models.user import User
from app.models.message import store as messages

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("")
async def list_channels(_: User = Depends(current_user)):
    return {"channels": messages.list_channels()}


@router.get("/{channel_id}/messages")
async def history(
    channel_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    _: User = Depends(current_user),
):
    return {"messages": messages.list_messages(channel_id, limit)}
