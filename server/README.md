# enclave server (Python)

FastAPI + python-socketio backend. Wire-compatible with the React client.

## correr

```bash
uv venv
source .venv/bin/activate
uv pip install -e .
cp .env.example .env       # opcional
uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
```

o en modo script:

```bash
python -m app.main
```

## endpoints

  GET  /api/health
  POST /api/auth/register   { username, password }
  POST /api/auth/login      { username, password }
  GET  /api/me
  GET  /api/channels
  GET  /api/channels/{id}/messages?limit=50
  GET  /api/friends
  POST /api/friends/request  { username }
  POST /api/friends/accept   { userId }
  POST /api/friends/reject   { userId }

  socket.io en /socket.io — ver `app/sockets/manager.py` para eventos
