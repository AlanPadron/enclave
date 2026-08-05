# enclave

App de mensajería minimalista. Estado: **alpha 0.3** — backend migrado a Python (FastAPI + python-socketio).

## qué hay

- 3 canales preconfigurados: `#general` (texto), `#voice-lounge` (voz, mic + cam con grid tipo Discord), `#ai-sage` (agente IA, placeholder offline)
- sistema de amigos: enviar solicitud, aceptar, rechazar
- auth con JWT (registro + login con validacion: sin espacios al inicio/final, sin espacios en passwords)
- mensajes en tiempo real con Socket.io
- animacion de entrada (logo "enclave" con cascade blur→clear)
- 3 temas con switch en vivo: default (negro glass), claro (blanco glass), cálido (beige/marrón glass)
- boton de ajustes con pop-up + modal de confirmacion de logout
- dark mode, liquid-glass sutil (sin exagerar)
- persistencia **en memoria** (se pierde al reiniciar el server)

## estructura

  client/  React 18 + Vite
  server/  FastAPI + python-socketio (Python 3.10+)

## cómo correr

Necesitas **Python 3.10+** (probado en 3.12) y **Node 18+** (probado en 24) para el frontend.

### server (Python)

```bash
cd server
source .venv/bin/activate
uv pip install -e .
python -m app.main        # arranca en :4000
```

### client (Node)

```bash
cd client
npm install
npm run dev                # abre http://localhost:5173
```

Abre dos pestañas en http://localhost:5173, registra dos usuarios distintos, y prueba:
- enviar mensajes en `#general` → aparecen en tiempo real
- mandar solicitud de amistad entre las dos cuentas
- entrar a `#voice-lounge` → el navegador pide permiso de mic, opcional cam
- escribir en `#ai-sage` → recibes un eco marcado como offline

## wire shape

El backend expone los mismos endpoints y eventos socket.io que la versión anterior (Express), así que el frontend React no necesitó cambios. La forma de error se mantiene como `{"error": "..."}` (no `{"detail": "..."}`).

## notas para iterar

- La persistencia en memoria es el mismo approach. Cuando agregues Mongo, edita `server/app/models/user.py` y `message.py`.
- `voice-lounge` y `ai-sage` son espacios reservados. WebRTC P2P y la conexion al modelo de IA se conectan despues.
- Si quieres ajustar la animacion de entrada, mira `client/src/components/Intro/Intro.jsx` y `client/src/styles/intro.css`.

## proximos pasos

1. Reemplazar persistencia en memoria por MongoDB (motor asíncrono: `motor`)
2. WebRTC real para canales de voz
3. Conectar el agente IA a un modelo
4. Soporte para mensajes directos (DMs)
5. Typing indicators y presencia real
