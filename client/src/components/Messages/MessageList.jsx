import React, { useEffect, useRef } from 'react'
import MessageItem from './MessageItem.jsx'
import './messages.css'

const GROUP_WINDOW_MS = 5 * 60 * 1000

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function MessageList({ messages, kind }) {
  const endRef = useRef(null)
  const lastHeightRef = useRef(0)
  const containerRef = useRef(null)

  // Smooth auto-scroll: only stick to bottom if user was already near the bottom
  useEffect(() => {
    const el = containerRef.current
    if (!el) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const wasNearBottom = distanceFromBottom < 80
    if (wasNearBottom) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    lastHeightRef.current = el.scrollHeight
  }, [messages])

  if (!messages.length) {
    return (
      <div className="messages empty" ref={containerRef}>
        <div className="empty-card">
          <div className="empty-mark">·</div>
          <div className="empty-title">sin mensajes todavía</div>
          <div className="empty-sub muted">
            {kind === 'voice'
              ? 'este canal es solo de voz por ahora'
              : kind === 'ai'
              ? 'escribe algo — el agente aún no está conectado'
              : 'rompe el hielo'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="messages" ref={containerRef}>
      <div className="messages-inner">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const grouped =
            prev &&
            prev.authorId === m.authorId &&
            m.createdAt - prev.createdAt < GROUP_WINDOW_MS
          const showDay = !prev || !isSameDay(prev.createdAt, m.createdAt)
          return (
            <MessageItem
              key={m.id}
              message={m}
              grouped={grouped}
              showDay={showDay}
            />
          )
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}
