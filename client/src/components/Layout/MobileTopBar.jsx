import React from 'react'
import './shell.css'

// Top bar shown only on small screens. Hidden on desktop via CSS.
export default function MobileTopBar({ channelName, onOpenFriends, onOpenChannels, onOpenSettings }) {
  return (
    <div className="mobile-topbar" role="toolbar" aria-label="navegación">
      <button
        className="btn btn-ghost mobile-icon-btn"
        onClick={onOpenFriends}
        aria-label="amigos"
        title="amigos"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="7.5" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="13" cy="8.2" r="2.1" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 16.5c.6-2.4 2.7-3.7 5-3.7s4.4 1.3 5 3.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 13.4c1.6-.4 3.3 0 4.2 1.2.5.6.8 1.4.8 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <button
        className="btn btn-ghost mobile-icon-btn"
        onClick={onOpenChannels}
        aria-label="canales"
        title="canales"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div className="mobile-topbar-title">
        <span className="brand-dot" />
        <span className="mobile-topbar-channel">{channelName || 'enclave'}</span>
      </div>
      <button
        className="btn btn-ghost mobile-icon-btn"
        onClick={onOpenSettings}
        aria-label="ajustes"
        title="ajustes"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
