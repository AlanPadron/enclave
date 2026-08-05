"""In-memory user store. Same shape as the previous Express version."""
import threading
import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class User:
    id: str
    username: str
    password_hash: str
    created_at: int
    friends: list[str] = field(default_factory=list)
    incoming: list[str] = field(default_factory=list)
    outgoing: list[str] = field(default_factory=list)
    status: str = "online"


class UserStore:
    def __init__(self) -> None:
        self._by_id: dict[str, User] = {}
        self._by_username: dict[str, User] = {}
        self._lock = threading.RLock()

    def find_by_id(self, user_id: str) -> Optional[User]:
        with self._lock:
            return self._by_id.get(user_id)

    def find_by_username(self, username: str) -> Optional[User]:
        with self._lock:
            return self._by_username.get(username.lower())

    def find_many_by_ids(self, ids: list[str]) -> list[User]:
        with self._lock:
            return [u for u in (self._by_id.get(i) for i in ids) if u is not None]

    def create(self, username: str, password_hash: str) -> User:
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            password_hash=password_hash,
            created_at=int(__import__("time").time() * 1000),
        )
        with self._lock:
            self._by_id[user.id] = user
            self._by_username[user.username.lower()] = user
        return user

    def send_request(self, from_id: str, to_id: str) -> str:
        with self._lock:
            frm = self._by_id.get(from_id)
            to = self._by_id.get(to_id)
            if not frm or not to:
                return "missing"
            if frm.id in to.friends or from_id in to.incoming:
                return "exists"
            if to_id not in frm.outgoing:
                frm.outgoing.append(to_id)
            if from_id not in to.incoming:
                to.incoming.append(from_id)
            return "sent"

    def accept_request(self, current_id: str, from_id: str) -> str:
        with self._lock:
            me = self._by_id.get(current_id)
            other = self._by_id.get(from_id)
            if not me or not other:
                return "missing"
            if from_id not in me.incoming:
                return "no-request"
            me.incoming = [i for i in me.incoming if i != from_id]
            other.outgoing = [i for i in other.outgoing if i != current_id]
            if from_id not in me.friends:
                me.friends.append(from_id)
            if current_id not in other.friends:
                other.friends.append(current_id)
            return "accepted"

    def reject_request(self, current_id: str, from_id: str) -> str:
        with self._lock:
            me = self._by_id.get(current_id)
            other = self._by_id.get(from_id)
            if not me or not other:
                return "missing"
            me.incoming = [i for i in me.incoming if i != from_id]
            if other:
                other.outgoing = [i for i in other.outgoing if i != current_id]
            return "rejected"

    @staticmethod
    def public_profile(user: Optional[User]) -> Optional[dict]:
        if not user:
            return None
        return {
            "id": user.id,
            "username": user.username,
            "status": user.status,
            "friends": list(user.friends),
        }


store = UserStore()
