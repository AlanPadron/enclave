"""Socket.io manager — wire-compatible with the React client.

Events:
  Server -> client:
    - message:new            { id, channelId, authorId, authorName, body, createdAt }
    - voice:state            { userId, username, muted, speaking, camera, joined, self? }
    - voice:leave            { userId }
  Client -> server:
    - channel:join           channelId
    - channel:leave          channelId
    - message:send           { channelId, body, _clientId? }
    - voice:join             { channelId }
    - voice:leave            { channelId }
    - voice:state            { channelId, muted, speaking, camera }
"""
import logging

import socketio

from app.models.message import channel_store as channels
from app.models.user import store as users
from app.services.auth import decode_token

log = logging.getLogger("enclave.sockets")

# Track who is currently in each voice channel (sid set) so we can enforce
# max_users without a per-call room-members roundtrip.
_voice_roster: dict[str, set] = {}


def register_socket_handlers(sio: socketio.AsyncServer) -> None:
    @sio.event
    async def connect(sid, environ, auth):
        token = (auth or {}).get("token") if isinstance(auth, dict) else None
        if not token:
            raise ConnectionRefusedError("no token")
        payload = decode_token(token)
        if not payload:
            raise ConnectionRefusedError("bad token")
        user = users.find_by_id(payload["sub"])
        if not user:
            raise ConnectionRefusedError("invalid user")
        await sio.save_session(sid, {"user_id": user.id, "username": user.username})
        await sio.enter_room(sid, f"user:{user.id}")
        log.info("connect sid=%s user=%s", sid, user.username)
        return True

    @sio.event
    async def disconnect(sid):
        session = await sio.get_session(sid)
        if session:
            log.info("disconnect sid=%s user=%s", sid, session.get("username"))

    @sio.on("channel:join")
    async def on_channel_join(sid, channel_id):
        session = await sio.get_session(sid)
        if not session:
            return
        ch = channels.get_visible(channel_id, session["user_id"])
        if not ch:
            return
        await sio.enter_room(sid, f"chan:{channel_id}")

    @sio.on("channel:leave")
    async def on_channel_leave(sid, channel_id):
        await sio.leave_room(sid, f"chan:{channel_id}")

    @sio.on("message:send")
    async def on_message_send(sid, data):
        channel_id = (data or {}).get("channelId")
        body = (data or {}).get("body") or ""
        client_id = (data or {}).get("_clientId")
        if not channel_id or not body.strip():
            return
        session = await sio.get_session(sid)
        if not session:
            return
        ch = channels.get_visible(channel_id, session["user_id"])
        if not ch:
            return

        def with_client_id(msg: dict) -> dict:
            return {**msg, "_clientId": client_id} if client_id else msg

        if ch.kind == "ai":
            user_msg = channels.add_message(
                channel_id, session["user_id"], session["username"], body.strip()
            )
            await sio.emit("message:new", with_client_id(user_msg), room=f"chan:{channel_id}")
            reply = channels.add_message(
                channel_id, "ai", "sage", "[AI no conectado — espacio reservado para el agente]"
            )
            import asyncio
            await asyncio.sleep(0.4)
            await sio.emit("message:new", reply, room=f"chan:{channel_id}")
            return

        msg = channels.add_message(
            channel_id, session["user_id"], session["username"], body.strip()
        )
        await sio.emit("message:new", with_client_id(msg), room=f"chan:{channel_id}")

    @sio.on("voice:join")
    async def on_voice_join(sid, data):
        channel_id = (data or {}).get("channelId")
        session = await sio.get_session(sid)
        if not session:
            return
        ch = channels.get_visible(channel_id, session["user_id"])
        if not ch or ch.kind != "voice":
            return
        # Enforce max_users cap via the manager's voice roster (cheaper than
        # asking socket.io for the room members).
        roster = _voice_roster.get(channel_id, set())
        if ch.max_users is not None and sid not in roster and len(roster) >= ch.max_users:
            await sio.emit("voice:error", {"error": f"el canal está lleno ({ch.max_users} max)"}, to=sid)
            return
        await sio.enter_room(sid, f"chan:{channel_id}")
        _voice_roster.setdefault(channel_id, set()).add(sid)
        payload = {
            "userId": session["user_id"],
            "username": session["username"],
            "muted": True,
            "speaking": False,
            "camera": False,
            "joined": True,
            "self": True,
        }
        await sio.emit("voice:state", payload, to=sid)
        others = {**payload, "self": False}
        await sio.emit("voice:state", others, room=f"chan:{channel_id}", skip_sid=sid)

    @sio.on("voice:leave")
    async def on_voice_leave(sid, data):
        channel_id = (data or {}).get("channelId")
        session = await sio.get_session(sid)
        ch = channels.get(channel_id)
        if not ch or ch.kind != "voice":
            return
        if session:
            await sio.emit(
                "voice:leave",
                {"userId": session["user_id"]},
                room=f"chan:{channel_id}",
                skip_sid=sid,
            )
        _voice_roster.get(channel_id, set()).discard(sid)
        if not _voice_roster.get(channel_id):
            _voice_roster.pop(channel_id, None)
        await sio.leave_room(sid, f"chan:{channel_id}")

    @sio.on("voice:state")
    async def on_voice_state(sid, data):
        channel_id = (data or {}).get("channelId")
        session = await sio.get_session(sid)
        if not session:
            return
        ch = channels.get_visible(channel_id, session["user_id"])
        if not ch or ch.kind != "voice":
            return
        await sio.emit(
            "voice:state",
            {
                "userId": session["user_id"],
                "username": session["username"],
                "muted": bool(data.get("muted")),
                "speaking": bool(data.get("speaking")),
                "camera": bool(data.get("camera")),
            },
            room=f"chan:{channel_id}",
            skip_sid=sid,
        )
