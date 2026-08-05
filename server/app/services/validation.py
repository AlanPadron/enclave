"""Input validation — keeps the same rules as the previous Express version."""
import re

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,24}$")


def valid_username(value) -> bool:
    return isinstance(value, str) and bool(USERNAME_RE.match(value))


def valid_password(value) -> bool:
    return (
        isinstance(value, str)
        and len(value) >= 6
        and len(value) <= 128
        and not any(c.isspace() for c in value)
    )


def extract_bearer(auth_header: str | None) -> str | None:
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:].strip() or None
