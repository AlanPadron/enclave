import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import './channels.css'

const ICONS = {
  text: '#',
  voice: '~',
  ai: '✦',
}

export default function ChannelList({ channels, active, onPick }) {
  const navigate = useNavigate()
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Self-contained retry: the AppShell already tries once, but if it failed
  // the user can click here to retry without reloading the whole app.
  async function retry() {
    setLoading(true)
    setLoadError(null)
    try {
      const { channels } = await api.channels(api.token())
      // The AppShell owns the state. We just tell it to refresh.
      // A simple location.reload() works too — but is heavy. Instead, we
      // dispatch a custom event the AppShell listens to.
      window.dispatchEvent(new CustomEvent('enclave:refresh-channels', { detail: { channels } }))
    } catch (err) {
      setLoadError(err.message || 'no se pudieron cargar los canales')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="section-title">channels</div>

      {channels.length === 0 ? (
        <div className="channel-empty">
          <div className="channel-empty-mark">·</div>
          <div className="channel-empty-text dim">
            {loadError ? 'no se pudieron cargar' : 'cargando…'}
          </div>
          <button
            className="btn btn-ghost channel-retry"
            onClick={retry}
            disabled={loading}
          >
            {loading ? 'reintentando…' : 'reintentar'}
          </button>
        </div>
      ) : (
        <div className="channel-list">
          {channels.map((c) => (
            <button
              key={c.id}
              className={`channel-row ${active === c.id ? 'active' : ''}`}
              onClick={() => { navigate(`/app/${c.id}`); onPick?.() }}
              title={c.description}
            >
              <span className={`channel-icon kind-${c.kind}`}>{ICONS[c.kind] || '#'}</span>
              <span className="channel-name">{c.name}</span>
              {c.kind === 'voice' && <span className="channel-pill">voice</span>}
              {c.kind === 'ai' && <span className="channel-pill ai">ai</span>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
