import React, { useEffect } from 'react'
import { getSocket } from '../../services/websocket.js'
import { useVoice } from '../../services/voice.jsx'
import './voice.css'

export default function VoicePlaceholder({ channelId }) {
  const voice = useVoice()
  const isOnChannel = channelId === voice.voiceChannel

  // Sync peer state from socket (only while on the voice channel)
  useEffect(() => {
    const sock = getSocket()
    if (!sock) return
    function onState(s) {
      voice.setPeers(prev => {
        const next = prev.filter(p => p.userId !== s.userId)
        next.push(s)
        return next
      })
    }
    function onLeave(s) {
      voice.setPeers(prev => prev.filter(p => p.userId !== s.userId))
    }
    sock.on('voice:state', onState)
    sock.on('voice:leave', onLeave)
    return () => {
      sock.off('voice:state', onState)
      sock.off('voice:leave', onLeave)
    }
  }, [voice])

  // Pre-join lobby (only when on voice channel and not yet joined)
  if (isOnChannel && !voice.joined) {
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
            onClick={voice.join}
            style={{ marginTop: 16 }}
          >
            entrar al canal
          </button>
          {voice.error && <div className="voice-error">{voice.error}</div>}
          {voice.peers.length > 0 && (
            <div className="voice-peers">
              <div className="friends-label">en el canal</div>
              {voice.peers.map(p => (
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

  // In call on voice channel — full grid
  if (isOnChannel && voice.joined && !voice.minimized) {
    const localCamOn = voice.camOn && voice.localStreamRef.current
    return (
      <div className="voice-wrap voice-active">
        <div className="voice-grid">
          <Tile
            name="tú"
            you
            cameraOn={localCamOn}
            muted={!voice.micOn}
            videoRef={voice.localVideoRef}
          />
          {voice.peers
            .filter(p => !p.self)
            .map(p => (
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
            className={`vc-btn ${voice.micOn ? '' : 'off'}`}
            onClick={voice.toggleMic}
            title={voice.micOn ? 'silenciar mic' : 'activar mic'}
          >
            {voice.micOn ? '🎙' : '🚫'}
          </button>
          <button
            className={`vc-btn ${voice.camOn ? '' : 'off'}`}
            onClick={voice.toggleCam}
            title={voice.camOn ? 'apagar cámara' : 'encender cámara'}
          >
            {voice.camOn ? '◉' : '◯'}
          </button>
          <button className="vc-btn end" onClick={voice.leave} title="salir">
            ⏻
          </button>
          <button className="vc-btn pip" onClick={voice.minimize} title="minimizar">
            ↘
          </button>
        </div>
        {voice.error && <div className="voice-error">{voice.error}</div>}
      </div>
    )
  }

  return null
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
        <span className="tile-name">{name}{you ? '' : ''}</span>
        {muted && <span className="tile-mute" title="silenciado">🎙×</span>}
      </div>
    </div>
  )
}
