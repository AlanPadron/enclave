// Cross-platform install prompt.
// - Android/Chrome: captures window.beforeinstallprompt and renders an in-app
//   install button (the native browser prompt is suppressed by default).
// - iOS Safari: there is NO beforeinstallprompt. We detect iOS Safari and show
//   a friendly banner with the "tap Share → Add to Home Screen" instructions.
// - Hidden if the app is already running as an installed PWA
//   (display-mode: standalone) or the user dismissed it before.

import React, { useEffect, useState, useCallback } from 'react'
import './install-prompt.css'

const DISMISS_KEY = 'enclave.install.dismissed'
const DISMISS_DAYS = 14

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIosSafari() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isWebkit = /WebKit/.test(ua)
  const isCriOS = /CriOS/.test(ua) // Chrome on iOS
  const isFxiOS = /FxiOS/.test(ua)  // Firefox on iOS
  return isIos && isWebkit && !isCriOS && !isFxiOS
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    if (!Number.isFinite(ts)) return false
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
}

export default function InstallPrompt() {
  const [mode, setMode] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if (isStandalone()) return
    if (recentlyDismissed()) return

    if (isIosSafari()) {
      // iOS: no event. Show after the intro animation finishes.
      const t = setTimeout(() => setMode('ios'), 2200)
      return () => clearTimeout(t)
    }

    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const close = useCallback(() => {
    dismiss()
    setMode(null)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    try { await deferredPrompt.userChoice } catch {}
    setDeferredPrompt(null)
    setMode(null)
    dismiss()
  }, [deferredPrompt])

  if (!mode) return null

  return (
    <div className="install-prompt" role="dialog" aria-live="polite">
      {mode === 'ios' ? (
        <>
          <div className="install-prompt-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="install-prompt-body">
            <div className="install-prompt-title">agrega enclave a tu inicio</div>
            <div className="install-prompt-sub">
              toca <span className="ip-icon" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span> compartir y luego <b>“agregar al inicio”</b>. se abrirá como app nativa.
            </div>
          </div>
          <button className="btn btn-ghost install-prompt-close" onClick={close} aria-label="cerrar">×</button>
        </>
      ) : (
        <>
          <div className="install-prompt-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v6m0 0l-2.5-2.5M12 14l2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="install-prompt-body">
            <div className="install-prompt-title">instala enclave</div>
            <div className="install-prompt-sub">ábrelo como app, sin barra del navegador.</div>
          </div>
          <button className="btn btn-primary install-prompt-action" onClick={install}>instalar</button>
          <button className="btn btn-ghost install-prompt-close" onClick={close} aria-label="cerrar">×</button>
        </>
      )}
    </div>
  )
}
