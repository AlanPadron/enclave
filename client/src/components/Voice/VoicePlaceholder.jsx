import React, { useEffect, useRef, useState } from 'react'
import { getSocket } from '../../services/websocket.js'
import './voice.css'

export default function VoicePlaceholder({ channelId, me }) {
  const [peers, setPeers] = useState([])
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)

  const localStreamRef = useRef(null)
  const localVideoRef = useRef(null)

  useEffect(() => {
    const sock = getSocket()
    if (!sock) return

    function onState(s) {
      setPeers((prev) => {
        const next = prev.filter((p) => p.userId !== s.userId)
        next.push(s)
        return next
      })
    }
    function onLeave(s) {
      setPeers((prev) => prev.filter((p) => p.userId !== s.userId))
    }
    sock.on('voice:state', onState)
    sock.on('voice:leave', onLeave)
    sock.emit('voice:join', { channelId })

    return () => {
      sock.off('voice:state', onState)
      sock.off('voice:leave', onLeave)
      sock.emit('voice:leave', { channelId })
      stopMedia()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  function announce({ mic, cam }) {
    const sock = getSocket()
    if (!sock) return
    sock.emit('voice:state', {
      channelId,
      muted: !mic,
      speaking: !!mic,
      camera: !!cam,
      username: me?.username,
    })
  }

  async function requestMedia({ mic, cam }) {
    setError(null)
    try {
      const constraints = {
        audio: !!mic,
        video: cam ? { width: 640, height: 480, facingMode: 'user' } : false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      // If a previous stream exists, stop it first
      stopMedia()
      localStreamRef.current = stream
      if (cam && localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      return stream
    } catch (err) {
      setError(permErrorMessage(err))
      return null
    }
  }

  function stopMedia() {
    const s = localStreamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
  }

  async function joinVoice() {
    setJoining(true)
    setError(null)
    const stream = await requestMedia({ mic: true, cam: false })
    if (!stream) {
      setJoining(false)
      return
    }
    setMicOn(true)
    setCamOn(false)
    setJoined(true)
    setVoiceActive(true)
    announce({ mic: true, cam: false })
    setJoining(false)
  }

  function leaveVoice() {
    stopMedia()
    setMicOn(false)
    setCamOn(false)
    setVoiceActive(false)
    setJoined(false)
    const sock = getSocket()
    sock?.emit('voice:state', { channelId, muted: true, speaking: false, camera: false, username: me?.username })
  }

  async function toggleMic() {
    if (!joined) return
    const next = !micOn
    if (next) {
      const stream = await requestMedia({ mic: true, cam: camOn })
      if (!stream) return
    } else {
      const s = localStreamRef.current
      if (s) s.getAudioTracks().forEach((t) => t.stop())
    }
    setMicOn(next)
    announce({ mic: next, cam: camOn })
  }

  async function toggleCam() {
    if (!joined) {
      // First-time cam: also enable mic so the user is fully on air.
      const stream = await requestMedia({ mic: true, cam: true })
      if (!stream) return
      setMicOn(true)
      setCamOn(true)
      setJoined(true)
      setVoiceActive(true)
      announce({ mic: true, cam: true })
      return
    }
    const next = !camOn
    if (next) {
      const stream = await requestMedia({ mic: micOn, cam: true })
      if (!stream) return
    } else {
      const s = localStreamRef.current
      if (s) s.getVideoTracks().forEach((t) => t.stop())
      if (localVideoRef.current) localVideoRef.current.srcObject = null
    }
    setCamOn(next)
    announce({ mic: micOn, cam: next })
  }

  // Active voice call layout: grid of tiles
  if (voiceActive) {
    const localCamOn = camOn && localStreamRef.current
    return (
      <div className="voice-wrap voice-active">
        <div className="voice-grid">
          <Tile
            name={me?.username}
            you
            cameraOn={localCamOn}
            muted={!micOn}
            videoRef={localVideoRef}
          />
          {peers
            .filter((p) => p.userId !== me?.id)
            .map((p) => (
              <Tile
                key={p.userId}
                name={p.username}
                cameraOn={!!p.camera}
                muted={!!p.muted}
              />
            ))}
        </div>

        <div className="voice-controls">
          <button
            className={`vc-btn ${micOn ? '' : 'off'}`}
            onClick={toggleMic}
            title={micOn ? 'silenciar mic' : 'activar mic'}
          >
            {micOn ? '🎙' : '🚫'}
          </button>
          <button
            className={`vc-btn ${camOn ? '' : 'off'}`}
            onClick={toggleCam}
            title={camOn ? 'apagar cámara' : 'encender cámara'}
          >
            {camOn ? '◉' : '◯'}
          </button>
          <button className="vc-btn end" onClick={leaveVoice} title="salir">
            ⏻
          </button>
        </div>

        {error && <div className="voice-error">{error}</div>}
      </div>
    )
  }

  // Pre-join lobby
  return (
    <div className="voice-wrap">
      <div className="voice-card">
        <div className="voice-orb">
          <div className="voice-orb-inner" />
        </div>
        <div className="voice-title">voice lounge</div>
        <div className="voice-sub muted">
          para hablar necesitas permitir el micrófono. la cámara es opcional.
        </div>
        <button
          className="btn btn-primary"
          onClick={joinVoice}
          disabled={joining}
          style={{ marginTop: 16 }}
        >
          {joining ? 'pidiendo permiso…' : 'entrar al canal'}
        </button>
        {error && <div className="voice-error">{error}</div>}
        {peers.length > 0 && (
          <div className="voice-peers">
            <div className="friends-label">en el canal</div>
            {peers.map((p) => (
              <div key={p.userId} className="voice-peer">
                <div className="msg-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                  {(p.username || '?')[0].toUpperCase()}
                </div>
                <span>{p.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Tile({ name, you, cameraOn, muted, videoRef }) {
  return (
    <div className={`voice-tile ${cameraOn ? 'has-cam' : ''}`}>
      {cameraOn ? (
        <video ref={videoRef} autoPlay playsInline muted className="tile-video" />
      ) : (
        <div className="tile-avatar">{(name || '?')[0].toUpperCase()}</div>
      )}
      <div className="tile-meta">
        <span className="tile-name">{name}{you ? ' (tú)' : ''}</span>
        {muted && <span className="tile-mute" title="silenciado">🎙×</span>}
      </div>
    </div>
  )
}

function permErrorMessage(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError') return 'permiso denegado por el navegador'
  if (name === 'NotFoundError') return 'no se encontró micrófono/cámara'
  if (name === 'NotReadableError') return 'el dispositivo está siendo usado por otra app'
  return 'no se pudo acceder al dispositivo'
}
