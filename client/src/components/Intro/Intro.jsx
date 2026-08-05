import React, { useEffect, useState } from 'react'
import '../../styles/intro.css'

const LETTERS = ['e', 'n', 'c', 'l', 'a', 'v', 'e']

// Minimum visible time so the user always sees the brand, even on fast loads.
const MIN_VISIBLE = 1400

export default function Intro({ onDone, ready }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setFading(true), MIN_VISIBLE)
    return () => clearTimeout(t)
  }, [ready])

  useEffect(() => {
    if (!fading) return
    const t = setTimeout(() => onDone?.(), 650)
    return () => clearTimeout(t)
  }, [fading, onDone])

  return (
    <div className={`intro ${fading ? 'fading' : ''}`} aria-hidden>
      <div className="intro-logo" aria-label="enclave">
        {LETTERS.map((ch, i) => (
          <span
            key={i}
            className="glyph"
            style={{ animationDelay: `${120 + i * 60}ms` }}
          >
            {ch}
          </span>
        ))}
        <span className="dot" style={{ animationDelay: `${120 + LETTERS.length * 60}ms` }} />
      </div>
      <div className="intro-tag">a quieter place to talk</div>
    </div>
  )
}
