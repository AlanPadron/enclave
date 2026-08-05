import React from 'react'
import './ai.css'

export default function AIBanner() {
  return (
    <div className="ai-banner">
      <div className="ai-icon">✦</div>
      <div className="ai-text">
        <div className="ai-title">agente IA</div>
        <div className="ai-sub muted">canal reservado — sin modelo conectado todavía</div>
      </div>
      <span className="ai-pill">offline</span>
    </div>
  )
}
