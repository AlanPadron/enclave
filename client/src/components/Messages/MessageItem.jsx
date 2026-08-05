import React from 'react'
import './messages.css'

function timeLabel(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageItem({ message, grouped }) {
  const isAI = message.authorId === 'ai'
  return (
    <div className={`msg ${grouped ? 'grouped' : ''} ${isAI ? 'ai' : ''}`}>
      {!grouped ? (
        <div className="msg-avatar">{(message.authorName || '?')[0].toUpperCase()}</div>
      ) : (
        <div className="msg-spacer" />
      )}
      <div className="msg-body">
        {!grouped && (
          <div className="msg-meta">
            <span className="msg-author">{message.authorName}</span>
            <span className="msg-time mono dim">{timeLabel(message.createdAt)}</span>
          </div>
        )}
        <div className="msg-text">{message.body}</div>
      </div>
    </div>
  )
}
