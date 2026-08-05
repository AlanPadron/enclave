import React from 'react'
import './messages.css'

function timeLabel(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(ts) {
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return 'hoy'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'ayer'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default function MessageItem({ message, grouped, showDay, isFirstOfDay }) {
  const isAI = message.authorId === 'ai'
  return (
    <>
      {(showDay || isFirstOfDay) && (
        <div className="day-divider" role="separator">
          <span>{dayLabel(message.createdAt)}</span>
        </div>
      )}
      <div className={`msg ${grouped ? 'grouped' : ''} ${isAI ? 'ai' : ''} ${message.pending ? 'pending' : ''}`}>
        {grouped ? (
          <div className="msg-time-rail mono dim" title={new Date(message.createdAt).toLocaleString()}>
            {timeLabel(message.createdAt)}
          </div>
        ) : (
          <div className="msg-avatar" aria-hidden>
            {(message.authorName || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="msg-body">
          {!grouped && (
            <div className="msg-meta">
              <span className="msg-author">{message.authorName}</span>
              {message.pending && <span className="msg-pending mono dim">enviando…</span>}
            </div>
          )}
          <div className="msg-text">{message.body}</div>
        </div>
      </div>
    </>
  )
}
