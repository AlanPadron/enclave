import React from 'react'
import { useVoice } from '../../services/voice.jsx'
import './voice-pip.css'

export default function VoicePiP() {
  const voice = useVoice()
  if (!voice.joined || !voice.minimized) return null

  const localCamOn = voice.camOn && voice.localStreamRef.current
  const peerCount = voice.peers.length

  return (
    <div className="voice-pip glass-strong" role="region" aria-label="llamada en curso">
      <button
        className="voice-pip-restore"
        onClick={voice.restore}
        title="volver a la llamada"
      >
        <span className="voice-pip-dot" />
        <span className="voice-pip-label">en llamada</span>
        <span className="voice-pip-meta">
          {peerCount + 1} {peerCount === 0 ? 'participante' : 'participantes'}
        </span>
        <span className="voice-pip-arrow">↗</span>
      </button>
      <div className="voice-pip-preview">
        {localCamOn ? (
          <video
            ref={voice.localVideoRef}
            autoPlay
            playsInline
            muted
            className="voice-pip-video"
          />
        ) : (
          <div className="voice-pip-avatar">tú</div>
        )}
        <div className="voice-pip-icons">
          <span className={voice.micOn ? '' : 'off'}>🎙</span>
          <span className={voice.camOn ? '' : 'off'}>◉</span>
        </div>
      </div>
    </div>
  )
}
