import React, { useState } from 'react'
import { THEMES, applyTheme } from '../../services/theme.js'
import './settings.css'

export default function Settings({ open, onClose }) {
  const [current, setCurrent] = useState(
    document.documentElement.getAttribute('data-theme') || 'dark'
  )

  function pick(id) {
    applyTheme(id)
    setCurrent(id)
  }

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-strong modal-card settings-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-head">
          <div>
            <div className="modal-title">ajustes</div>
            <div className="modal-sub muted">tema de la app</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="cerrar">×</button>
        </div>
        <div className="divider" />
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-tile ${current === t.id ? 'active' : ''}`}
              data-theme-preview={t.id}
              onClick={() => pick(t.id)}
            >
              <div className="theme-preview" data-preview={t.id}>
                <span className="dot" />
                <span className="bar bar-2" />
                <span className="bar" />
              </div>
              <div className="theme-meta">
                <div className="theme-name">{t.name}</div>
                <div className="theme-desc muted">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
