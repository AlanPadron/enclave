"""Channel + message store.

Channels are now user-creatable (not hardcoded). The 3 originals are seeded
on first import so existing users still see the same channels.
"""
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Message:
    id: str
    channel_id: str
    author_id: str
    author_name: str
    body: str
    created_at: int


@dataclass
class Channel:
    id: str
    name: str
    label: str            # short tag shown next to the name
    kind: str             # 'text' | 'voice' | 'ai'
    description: str
    private: bool = False
    allowed_user_ids: list[str] = field(default_factory=list)
    max_users: Optional[int] = None  # only meaningful for 'voice'
    created_by: str = ""
    created_at: int = 0


class ChannelStore:
    def __init__(self) -> None:
        self._by_id: dict[str, Channel] = {}
        self._lock = threading.RLock()
        self._seed()

    def _seed(self) -> None:
        now = int(time.time() * 1000)
        seeds = [
            Channel(
                id="general", name="general", label="general",
                kind="text", description="Principal", created_by="system", created_at=now,
            ),
            Channel(
                id="voice-lounge", name="voice-lounge", label="voice",
                kind="voice", description="Voz (placeholder)", created_by="system", created_at=now,
            ),
            Channel(
                id="ai-sage", name="ai-sage", label="ai",
                kind="ai", description="Agente IA (no conectado)", created_by="system", created_at=now,
            ),
        ]
        for c in seeds:
            self._by_id[c.id] = c

    def list_for(self, user_id: str) -> list[dict]:
        with self._lock:
            return [
                self._serialize(c)
                for c in self._by_id.values()
                if not c.private or user_id in c.allowed_user_ids or c.created_by == user_id
            ]

    def get(self, channel_id: str) -> Optional[Channel]:
        with self._lock:
            return self._by_id.get(channel_id)

    def get_visible(self, channel_id: str, user_id: str) -> Optional[Channel]:
        c = self.get(channel_id)
        if not c:
            return None
        if c.private and user_id not in c.allowed_user_ids and c.created_by != user_id:
            return None
        return c

    def create(self, *, name: str, label: str, kind: str, description: str,
               created_by: str, private: bool = False, allowed_user_ids: Optional[list[str]] = None,
               max_users: Optional[int] = None) -> Channel:
        with self._lock:
            ch_id = name.lower().replace(" ", "-")
            # ensure unique id
            base = ch_id
            n = 1
            while ch_id in self._by_id:
                n += 1
                ch_id = f"{base}-{n}"
            ch = Channel(
                id=ch_id,
                name=name,
                label=label or name,
                kind=kind,
                description=description or "",
                private=private,
                allowed_user_ids=list(allowed_user_ids or []),
                max_users=max_users,
                created_by=created_by,
                created_at=int(time.time() * 1000),
            )
            # creator always has access to their own private channel
            if ch.private and created_by not in ch.allowed_user_ids:
                ch.allowed_user_ids.append(created_by)
            self._by_id[ch.id] = ch
            return ch

    def add_user_to_private(self, channel_id: str, user_id: str) -> bool:
        with self._lock:
            ch = self._by_id.get(channel_id)
            if not ch or not ch.private:
                return False
            if user_id not in ch.allowed_user_ids:
                ch.allowed_user_ids.append(user_id)
            return True

    def remove_user_from_private(self, channel_id: str, user_id: str) -> bool:
        with self._lock:
            ch = self._by_id.get(channel_id)
            if not ch or not ch.private:
                return False
            if user_id == ch.created_by:
                return False  # owner can't be removed
            ch.allowed_user_ids = [u for u in ch.allowed_user_ids if u != user_id]
            return True

    def add_message(self, channel_id: str, author_id: str, author_name: str, body: str) -> dict:
        with self._lock:
            ch = self._by_id.get(channel_id)
            if not ch:
                raise ValueError("channel not found")
            msg = Message(
                id=str(uuid.uuid4()),
                channel_id=channel_id,
                author_id=author_id,
                author_name=author_name,
                body=body,
                created_at=int(time.time() * 1000),
            )
            self._messages.setdefault(channel_id, []).append(msg)
        return self._serialize_message(msg)

    _messages: dict[str, list[Message]] = {}

    def list_messages(self, channel_id: str, limit: int = 50) -> list[dict]:
        with self._lock:
            messages = self._messages.get(channel_id, [])
            return [self._serialize_message(m) for m in messages[-limit:]]

    @staticmethod
    def _serialize(c: Channel) -> dict:
        return {
            "id": c.id,
            "name": c.name,
            "label": c.label,
            "kind": c.kind,
            "description": c.description,
            "private": c.private,
            "allowedUserIds": list(c.allowed_user_ids),
            "maxUsers": c.max_users,
            "createdBy": c.created_by,
            "createdAt": c.created_at,
        }

    @staticmethod
    def _serialize_message(m: Message) -> dict:
        return {
            "id": m.id,
            "channelId": m.channel_id,
            "authorId": m.author_id,
            "authorName": m.author_name,
            "body": m.body,
            "createdAt": m.created_at,
        }


channel_store = ChannelStore()
