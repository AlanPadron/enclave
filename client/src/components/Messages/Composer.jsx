import React, { useState, useRef, useEffect } from 'react'
import './messages.css'

const MAX_LENGTH = 2000

export default function Composer({ onSend, disabled, placeholder }) {
  const [text, setText] = useState('')
  const taRef = useRef(null)

  // Auto-grow textarea up to 6 lines
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 144) + 'px'
  }, [text])

  function submit(e) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || disabled) return
    onSend(body)
    setText('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const remaining = MAX_LENGTH - text.length
  const showCounter = remaining < 200

  return (
    <form className="composer" onSubmit={submit}>
      <div className={`composer-wrap ${disabled ? 'disabled' : ''}`}>
        <textarea
          ref={taRef}
          className="composer-input"
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder={
            placeholder ||
            (disabled
              ? 'voz solo — sin texto por ahora'
              : 'escribe un mensaje · enter para enviar · shift+enter nueva línea')
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
        {showCounter && (
          <span className={`composer-counter mono dim ${remaining < 0 ? 'over' : ''}`}>
            {remaining}
          </span>
        )}
        <button
          className="composer-send"
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="enviar"
          title="enviar (enter)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 8L14 2L8 14L7 9L2 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  )
}
