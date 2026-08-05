"""Socket.io manager — wire-compatible with the React client.

Events:
  Server -> client:
    - message:new            { id, channelId, authorId, authorName, body, createdAt }
    - voice:state            { userId, username, muted, speaking, camera, joined, self? }
    - voice:leave            { userId }
  Client -> server:
    - channel:join           channelId
    - channel:leave          channelId
    - message:send           { channelId, body }
    - voice:join             { channelId }
    - voice:leave            { channelId }
    - voice:state            { channelId, muted, speaking, camera }
"""
import logging

import socketio

from app.models.message import store as messages
from app.models.user import store as users
from app.services.auth import decode_token

log = logging.getLogger("enclave.sockets")


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
        # Stash user info on the session for later handlers
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
        await sio.enter_room(sid, f"chan:{channel_id}")

    @sio.on("channel:leave")
    async def on_channel_leave(sid, channel_id):
        await sio.leave_room(sid, f"chan:{channel_id}")

    @sio.on("message:send")
    async def on_message_send(sid, data):
        channel_id = (data or {}).get("channelId")
        body = (data or {}).get("body") or ""
        if not channel_id or not body.strip():
            return
        channel = messages.get_channel(channel_id)
        if not channel:
            return
        session = await sio.get_session(sid)
        if not session:
            return

        if channel["kind"] == "ai":
            user_msg = messages.add_message(
                channel_id, session["user_id"], session["username"], body.strip()
            )
            await sio.emit("message:new", user_msg, room=f"chan:{channel_id}")
            reply = messages.add_message(
                channel_id, "ai", "sage", "[AI no conectado — espacio reservado para el agente]"
            )
            # Echo back after a tiny delay so the UX feels alive
            import asyncio
            await asyncio.sleep(0.4)
            await sio.emit("message:new", reply, room=f"chan:{channel_id}")
            return

        msg = messages.add_message(
            channel_id, session["user_id"], session["username"], body.strip()
        )
        await sio.emit("message:new", msg, room=f"chan:{channel_id}")

    @sio.on("voice:join")
    async def on_voice_join(sid, data):
        channel_id = (data or {}).get("channelId")
        ch = messages.get_channel(channel_id)
        if not ch or ch["kind"] != "voice":
            return
        await sio.enter_room(sid, f"chan:{channel_id}")
        session = await sio.get_session(sid)
        if not session:
            return
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
        ch = messages.get_channel(channel_id)
        if not ch or ch["kind"] != "voice":
            return
        session = await sio.get_session(sid)
        if session:
            await sio.emit(
                "voice:leave",
                {"userId": session["user_id"]},
                room=f"chan:{channel_id}",
                skip_sid=sid,
            )
        await sio.leave_room(sid, f"chan:{channel_id}")

    @sio.on("voice:state")
    async def on_voice_state(sid, data):
        channel_id = (data or {}).get("channelId")
        ch = messages.get_channel(channel_id)
        if not ch or ch["kind"] != "voice":
            return
        session = await sio.get_session(sid)
        if not session:
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
