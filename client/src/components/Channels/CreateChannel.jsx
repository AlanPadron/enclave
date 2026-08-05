import React, { useState, useEffect } from 'react'
import { api } from '../../services/api.js'
import './create-channel.css'

const TYPES = [
  { id: 'text',  label: 'chat',   description: 'mensajes de texto en tiempo real', icon: '#' },
  { id: 'voice', label: 'voz',    description: 'llamada de audio con cam opcional',  icon: '~' },
]

const ICONS = { text: '#', voice: '~' }

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_. ]/g, '').trim().slice(0, 32)
}

export default function CreateChannel({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState('text')
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxUsersEnabled, setMaxUsersEnabled] = useState(false)
  const [maxUsers, setMaxUsers] = useState(8)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Auto-fill label from name
  useEffect(() => {
    if (!label || label === name) {
      setLabel(name.slice(0, 16))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(''); setLabel(''); setDescription(''); setKind('text')
      setIsPrivate(false); setMaxUsersEnabled(false); setMaxUsers(8)
      setError(null); setSubmitting(false)
    }
  }, [open])

  if (!open) return null

  async function submit(e) {
    e?.preventDefault()
    setError(null)
    const cleanName = slugify(name)
    if (cleanName.length < 2) {
      return setError('nombre inválido (mín 2 caracteres)')
    }
    if (!label.trim()) {
      return setError('etiqueta requerida')
    }
    setSubmitting(true)
    try {
      const payload = {
        name: cleanName,
        label: label.trim(),
        kind,
        description: description.trim(),
        private: isPrivate,
        allowedUserIds: [],  // can be edited later
      }
      if (kind === 'voice' && maxUsersEnabled) {
        payload.maxUsers = Number(maxUsers) || 0
      }
      const { channel } = await api.createChannel(api.token(), payload)
      onCreated?.(channel)
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-strong modal-card create-channel-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-head">
          <div>
            <div className="modal-title">crear canal</div>
            <div className="modal-sub muted">define el espacio antes de empezar</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="cerrar">×</button>
        </div>

        <form className="create-channel-form" onSubmit={submit}>
          <div className="cc-field">
            <label className="label">tipo</label>
            <div className="cc-types">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`cc-type ${kind === t.id ? 'active' : ''}`}
                  onClick={() => setKind(t.id)}
                >
                  <span className="cc-type-icon">{t.icon}</span>
                  <span className="cc-type-text">
                    <div className="cc-type-label">{t.label}</div>
                    <div className="cc-type-desc muted">{t.description}</div>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="cc-row">
            <div className="cc-field">
              <label className="label" htmlFor="cc-name">nombre</label>
              <input
                id="cc-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === 'text' ? 'general-chat' : 'team-standup'}
                maxLength={32}
                autoFocus
              />
              <div className="cc-hint dim">se usará como id: {slugify(name) || '—'}</div>
            </div>

            <div className="cc-field cc-label-field">
              <label className="label" htmlFor="cc-label">etiqueta</label>
              <input
                id="cc-label"
                className="input"
                value={label}
                onChange={(e) => setLabel(e.target.value.slice(0, 16))}
                placeholder="general"
                maxLength={16}
              />
              <div className="cc-hint dim">tag corto que se muestra al lado del nombre</div>
            </div>
          </div>

          <div className="cc-field">
            <label className="label" htmlFor="cc-desc">descripción (opcional)</label>
            <input
              id="cc-desc"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="de qué se trata este canal"
              maxLength={120}
            />
          </div>

          <div className="cc-options">
            <label className="cc-toggle">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span className="cc-toggle-body">
                <span className="cc-toggle-label">canal privado</span>
                <span className="cc-toggle-desc muted">
                  solo usuarios invitados o agregados después pueden ver y unirse
                </span>
              </span>
            </label>

            {kind === 'voice' && (
              <label className="cc-toggle">
                <input
                  type="checkbox"
                  checked={maxUsersEnabled}
                  onChange={(e) => setMaxUsersEnabled(e.target.checked)}
                />
                <span className="cc-toggle-body">
                  <span className="cc-toggle-label">límite de usuarios</span>
                  <span className="cc-toggle-desc muted">
                    máximo de personas que pueden estar en la llamada a la vez
                  </span>
                </span>
                {maxUsersEnabled && (
                  <input
                    type="number"
                    className="input cc-max-input"
                    value={maxUsers}
                    min={2}
                    max={100}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </label>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'creando…' : 'crear canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
