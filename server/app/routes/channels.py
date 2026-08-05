"""Channel routes: list/create/find channels, fetch message history."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import current_user
from app.models.user import User
from app.models.message import channel_store as channels

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("")
async def list_channels(user: User = Depends(current_user)):
    return {"channels": channels.list_for(user.id)}


@router.post("")
async def create_channel(body: dict, user: User = Depends(current_user)):
    name = (body.get("name") or "").strip()
    label = (body.get("label") or "").strip()
    kind = (body.get("kind") or "").strip()
    description = (body.get("description") or "").strip()
    private = bool(body.get("private"))
    allowed_user_ids = body.get("allowedUserIds") or []
    max_users = body.get("maxUsers")

    if not name or len(name) < 2 or len(name) > 32:
        raise HTTPException(400, "nombre inválido (2-32 chars)")
    if not label or len(label) > 16:
        raise HTTPException(400, "etiqueta inválida (1-16 chars)")
    if kind not in ("text", "voice"):
        raise HTTPException(400, "tipo debe ser 'text' o 'voice'")

    # Validate max_users (only for voice)
    if max_users is not None:
        if kind != "voice":
            raise HTTPException(400, "maxUsers solo aplica a canales de voz")
        if not isinstance(max_users, int) or max_users < 2 or max_users > 100:
            raise HTTPException(400, "maxUsers debe ser un entero entre 2 y 100")

    # Validate allowed user ids
    if private:
        if not isinstance(allowed_user_ids, list):
            raise HTTPException(400, "allowedUserIds debe ser una lista")
        # sanitize
        allowed_user_ids = [str(u) for u in allowed_user_ids if u]

    ch = channels.create(
        name=name,
        label=label,
        kind=kind,
        description=description,
        created_by=user.id,
        private=private,
        allowed_user_ids=allowed_user_ids,
        max_users=int(max_users) if max_users is not None else None,
    )
    return {"channel": channels._serialize(ch)}


@router.get("/{channel_id}/messages")
async def history(
    channel_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(current_user),
):
    ch = channels.get_visible(channel_id, user.id)
    if not ch:
        raise HTTPException(404, "channel not found")
    return {"messages": channels.list_messages(channel_id, limit)}


@router.post("/{channel_id}/invite")
async def invite_user(channel_id: str, body: dict, user: User = Depends(current_user)):
    ch = channels.get(channel_id)
    if not ch:
        raise HTTPException(404, "channel not found")
    if ch.created_by != user.id:
        raise HTTPException(403, "solo el creador puede invitar")
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        raise HTTPException(400, "userId required")
    ok = channels.add_user_to_private(channel_id, user_id)
    return {"ok": ok}
