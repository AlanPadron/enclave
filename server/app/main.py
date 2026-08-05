"""enclave backend — FastAPI + python-socketio.

Wire shape kept compatible with the existing React client:
  - REST endpoints under /api/...
  - Error responses use {"error": "..."} (NOT {"detail": "..."})
  - Socket.io v4 protocol on /socket.io/
"""
import logging
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request

from app.config import settings
from app.routes import auth, channels, friends
from app.sockets.manager import register_socket_handlers

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("enclave")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("enclave starting on :%d", settings.port)
    yield
    log.info("enclave shutting down")


app = FastAPI(title="enclave", version="0.2.0", lifespan=lifespan)

# CORS — open in dev, tighten in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Normalize errors to {"error": "..."} so the React client keeps working.
# HTTPException in FastAPI uses `detail` for the message; we let it stay a
# string and convert at the response layer via the handler below.
@app.exception_handler(HTTPException)
async def http_errors(_: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(detail)})


@app.exception_handler(Exception)
async def all_errors(_: Request, exc: Exception):
    log.exception("unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"error": str(exc) or "internal error"})


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


@app.get("/api/health")
async def health():
    return {"ok": True, "name": "enclave"}


app.include_router(auth.router, prefix="/api")
app.include_router(channels.router, prefix="/api")
app.include_router(friends.router, prefix="/api")
register_socket_handlers(sio)

# Mount socket.io at /socket.io
socket_app = socketio.ASGIApp(sio, socketio_path="")
app.mount("/socket.io", socket_app)


def main():
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
