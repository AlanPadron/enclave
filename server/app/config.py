"""enclave configuration via env vars."""
import os
from dataclasses import dataclass


@dataclass
class Settings:
    port: int = int(os.getenv("PORT", "4000"))
    secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    token_ttl_days: int = 7
    reload: bool = os.getenv("RELOAD", "1") == "1"
    mongo_uri: str = os.getenv("MONGO_URI", "")
    redis_url: str = os.getenv("REDIS_URL", "")


settings = Settings()
