import React, { useState } from 'react'
import {
  THEMES, FONT_SIZES, DENSITIES, COLOR_KEYS,
  getSettings, updateSetting, resetCustomColor, resetAll,
} from '../../services/theme.js'
import './settings.css'

const TABS = [
  { id: 'appearance', label: 'apariencia' },
  { id: 'palette',    label: 'colores' },
  { id: 'accessibility', label: 'accesibilidad' },
]

export default function Settings({ open, onClose }) {
  const [tab, setTab] = useState('appearance')
  const [s, setS] = useState(() => getSettings())

  function update(patch) {
    updateSetting(patch)
    setS(getSettings())
  }

  function pickColor(key, value) {
    update({ customColors: { [key]: value || null } })
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
            <div className="modal-sub muted">tema, tipografía y colores</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="cerrar">×</button>
        </div>

        <div className="settings-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`settings-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-body">
          {tab === 'appearance' && (
            <>
              <Section title="tema">
                <div className="theme-grid">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`theme-tile ${s.theme === t.id ? 'active' : ''}`}
                      onClick={() => update({ theme: t.id })}
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
              </Section>

              <Section title="tamaño de fuente">
                <div className="seg-group">
                  {FONT_SIZES.map(f => (
                    <button
                      key={f.id}
                      className={`seg ${s.fontSize === f.id ? 'active' : ''}`}
                      onClick={() => update({ fontSize: f.id })}
                      style={{ fontSize: `${f.scale}em` }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="densidad">
                <div className="seg-group">
                  {DENSITIES.map(d => (
                    <button
                      key={d.id}
                      className={`seg ${s.density === d.id ? 'active' : ''}`}
                      onClick={() => update({ density: d.id })}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === 'palette' && (
            <>
              <Section title="colores personalizados" sub="override del tema. déjalos vacíos para usar el valor del tema.">
                <div className="color-grid">
                  {COLOR_KEYS.map(({ key, label, description }) => (
                    <div key={key} className="color-row">
                      <div className="color-swatch-wrap">
                        <input
                          type="color"
                          className="color-swatch"
                          value={s.customColors[key] || defaultColorFor(key, s.theme)}
                          onChange={(e) => pickColor(key, e.target.value)}
                        />
                      </div>
                      <div className="color-meta">
                        <div className="color-label">{label}</div>
                        <div className="color-desc muted">{description}</div>
                      </div>
                      <div className="color-actions">
                        {s.customColors[key] && (
                          <button
                            className="btn btn-ghost small"
                            onClick={() => resetCustomColor(key)}
                            title="restablecer"
                          >
                            reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === 'accessibility' && (
            <>
              <Section title="movimiento">
                <label className="toggle-row">
                  <span>
                    <div className="toggle-label">reducir movimiento</div>
                    <div className="toggle-desc muted">desactiva animaciones no esenciales</div>
                  </span>
                  <input
                    type="checkbox"
                    checked={s.reduceMotion}
                    onChange={(e) => update({ reduceMotion: e.target.checked })}
                  />
                </label>
                <label className="toggle-row">
                  <span>
                    <div className="toggle-label">PiP compacto</div>
                    <div className="toggle-desc muted">miniatura más pequeña cuando minimizas la llamada</div>
                  </span>
                  <input
                    type="checkbox"
                    checked={s.compactPiP}
                    onChange={(e) => update({ compactPiP: e.target.checked })}
                  />
                </label>
              </Section>

              <Section title="restablecer">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm('¿restablecer todos los ajustes?')) {
                      resetAll()
                      setS(getSettings())
                    }
                  }}
                >
                  restablecer todo a default
                </button>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, sub, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-title">{title}</div>
      {sub && <div className="settings-section-sub muted">{sub}</div>}
      {children}
    </div>
  )
}

// Fallback colors when the user hasn't set a custom one and we need a default
// for the swatch to render.
function defaultColorFor(key, theme) {
  const map = {
    dark:  { accent: '#8b9eff', accent2: '#b8d6c8', ink: '#e7e9ee', ink2: '#a8acb8', ink3: '#6a6e7c', bg: '#0a0b10', danger: '#ff7a8a' },
    light: { accent: '#2b3566', accent2: '#4d5e4a', ink: '#15171c', ink2: '#4a4f5a', ink3: '#828791', bg: '#f4f5f7', danger: '#c4455a' },
    warm:  { accent: '#7a5a3a', accent2: '#4a6b56', ink: '#2a221a', ink2: '#5a4d3c', ink3: '#8a7c69', bg: '#efe7d8', danger: '#b04a3a' },
  }
  return (map[theme] || map.dark)[key] || '#888888'
}
