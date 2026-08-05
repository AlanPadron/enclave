import React from 'react'
import { useNavigate } from 'react-router-dom'
import './channels.css'

const ICONS = {
  text: '#',
  voice: '~',
  ai: '✦',
}

export default function ChannelList({ channels, active }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="section-title">channels</div>
      <div className="channel-list">
        {channels.map((c) => (
          <button
            key={c.id}
            className={`channel-row ${active === c.id ? 'active' : ''}`}
            onClick={() => navigate(`/app/${c.id}`)}
            title={c.description}
          >
            <span className={`channel-icon kind-${c.kind}`}>{ICONS[c.kind] || '#'}</span>
            <span className="channel-name">{c.name}</span>
            {c.kind === 'voice' && <span className="channel-pill">voice</span>}
            {c.kind === 'ai' && <span className="channel-pill ai">ai</span>}
          </button>
        ))}
      </div>
    </>
  )
}
