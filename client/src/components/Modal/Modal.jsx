import React from 'react'
import './modal.css'

export default function Modal({ open, title, sub, children, onClose, width = 380 }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-strong modal-card"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="modal-title">{title}</div>}
        {sub && <div className="modal-sub muted">{sub}</div>}
        {(title || sub) && <div className="divider" />}
        {children}
      </div>
    </div>
  )
}
