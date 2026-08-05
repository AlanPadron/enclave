"""In-memory message store + the 3 hardcoded channels."""
import threading
import time
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Message:
    id: str
    channel_id: str
    author_id: str
    author_name: str
    body: str
    created_at: int


CHANNELS: dict[str, dict] = {
    "general":      {"id": "general",      "name": "general",      "kind": "text",  "description": "Principal"},
    "voice-lounge": {"id": "voice-lounge", "name": "voice-lounge", "kind": "voice", "description": "Voz (placeholder)"},
    "ai-sage":      {"id": "ai-sage",      "name": "ai-sage",      "kind": "ai",    "description": "Agente IA (no conectado)"},
}


class MessageStore:
    def __init__(self) -> None:
        self._by_channel: dict[str, list[Message]] = {}
        self._lock = threading.RLock()

    def list_channels(self) -> list[dict]:
        return list(CHANNELS.values())

    def get_channel(self, channel_id: str) -> Optional[dict]:
        return CHANNELS.get(channel_id)

    def list_messages(self, channel_id: str, limit: int = 50) -> list[dict]:
        with self._lock:
            messages = self._by_channel.get(channel_id, [])
            return [self._serialize(m) for m in messages[-limit:]]

    def add_message(self, channel_id: str, author_id: str, author_name: str, body: str) -> dict:
        msg = Message(
            id=str(uuid.uuid4()),
            channel_id=channel_id,
            author_id=author_id,
            author_name=author_name,
            body=body,
            created_at=int(time.time() * 1000),
        )
        with self._lock:
            self._by_channel.setdefault(channel_id, []).append(msg)
        return self._serialize(msg)

    @staticmethod
    def _serialize(m: Message) -> dict:
        return {
            "id": m.id,
            "channelId": m.channel_id,
            "authorId": m.author_id,
            "authorName": m.author_name,
            "body": m.body,
            "createdAt": m.created_at,
        }


store = MessageStore()
