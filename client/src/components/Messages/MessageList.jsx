import React, { useEffect, useRef } from 'react'
import MessageItem from './MessageItem.jsx'
import './messages.css'

export default function MessageList({ messages, kind }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  if (!messages.length) {
    return (
      <div className="messages empty">
        <div className="empty-card">
          <div className="empty-title">sin mensajes todavía</div>
          <div className="empty-sub muted">
            {kind === 'voice' ? 'este canal es solo de voz por ahora' :
             kind === 'ai' ? 'escribe algo — el agente aún no está conectado' :
             'rompe el hielo'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="messages">
      <div className="messages-inner">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const grouped = prev && prev.authorId === m.authorId && (m.createdAt - prev.createdAt) < 5 * 60_000
          return <MessageItem key={m.id} message={m} grouped={grouped} />
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}
