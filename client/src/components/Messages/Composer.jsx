import React, { useState } from 'react'
import './messages.css'

export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    onSend(body)
    setText('')
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input
        className="input composer-input"
        placeholder={disabled ? 'voz solo — sin texto por ahora' : 'escribe un mensaje — enter para enviar'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button className="btn btn-primary" type="submit" disabled={disabled || !text.trim()}>
        enviar
      </button>
    </form>
  )
}
