# enclave

App de mensajería minimalista. Estado: **alpha 0.2** — primera base pulida lista para iterar.

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
  server/  Express + Socket.io

## cómo correr

Necesitas Node 18+ (probado en 24).

  cd server
  npm install
  npm run dev                # arranca en :4000

  cd client
  npm install
  npm run dev                # abre http://localhost:5173

Abre dos pestañas en http://localhost:5173, registra dos usuarios distintos, y prueba:
- enviar mensajes en `#general` → aparecen en tiempo real
- mandar solicitud de amistad entre las dos cuentas
- entrar a `#voice-lounge` (UI placeholder)
- escribir en `#ai-sage` → recibes un eco marcado como offline

## notas para iterar

- Los modelos Mongoose y la conexion a Redis ya tienen el slot listo en `server/src/config/`. Solo llena las variables en `.env` y descomenta las lineas.
- `voice-lounge` y `ai-sage` son espacios reservados. WebRTC y la conexion al modelo de IA se conectan despues.
- Si quieres ajustar la animacion de entrada, mira `client/src/components/Intro/Intro.jsx` y `client/src/styles/intro.css`.

## proximos pasos sugeridos

1. Reemplazar persistencia en memoria por MongoDB
2. WebRTC real para canales de voz
3. Conectar el agente IA a un modelo
4. Soporte para mensajes directos (DMs)
5. Typing indicators y presencia real
