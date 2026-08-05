import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import './channels.css'

const ICONS = { text: '#', voice: '~', ai: '✦' }

export default function ChannelList({ channels, active, onPick, onCreate }) {
  const navigate = useNavigate()
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function retry() {
    setLoading(true)
    setLoadError(null)
    try {
      const { channels } = await api.channels(api.token())
      window.dispatchEvent(new CustomEvent('enclave:refresh-channels', { detail: { channels } }))
    } catch (err) {
      setLoadError(err.message || 'no se pudieron cargar los canales')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="section-title-row">
        <div className="section-title">channels</div>
        {onCreate && (
          <button
            className="btn btn-ghost section-add"
            onClick={onCreate}
            title="crear canal"
            aria-label="crear canal"
          >
            +
          </button>
        )}
      </div>

      {loadError ? (
        <div className="channel-empty">
          <div className="channel-empty-mark">·</div>
          <div className="channel-empty-text dim">no se pudieron cargar</div>
          <button
            className="btn btn-ghost channel-retry"
            onClick={retry}
            disabled={loading}
          >
            {loading ? 'reintentando…' : 'reintentar'}
          </button>
        </div>
      ) : channels.length === 0 ? (
        <div className="channel-empty">
          <div className="channel-empty-mark">·</div>
          <div className="channel-empty-text">sin canales todavía</div>
          {onCreate && (
            <button
              className="btn btn-primary channel-retry"
              onClick={onCreate}
            >
              crear el primero
            </button>
          )}
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
              {c.label && c.label !== c.name && (
                <span className={`channel-pill kind-${c.kind}`}>{c.label}</span>
              )}
              {c.private && <span className="channel-pill private" title="privado">🔒</span>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
