import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { getSocket } from './websocket.js'

const VoiceContext = createContext(null)

export function VoiceProvider({ children }) {
  const [joined, setJoined] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [peers, setPeers] = useState([])
  const [error, setError] = useState(null)
  const [minimized, setMinimized] = useState(false)

  const localStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const voiceChannelRef = useRef('voice-lounge')

  const announce = useCallback(({ mic, cam }) => {
    const sock = getSocket()
    if (!sock) return
    sock.emit('voice:state', {
      channelId: voiceChannelRef.current,
      muted: !mic,
      speaking: !!mic,
      camera: !!cam,
      username: undefined, // server will fill from session
    })
  }, [])

  async function requestMedia({ mic, cam }) {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: !!mic,
        video: cam ? { width: 320, height: 240, facingMode: 'user' } : false,
      })
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
      localStreamRef.current = stream
      if (cam && localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      return stream
    } catch (err) {
      setError(permErrorMessage(err))
      return null
    }
  }

  // "Demo mode" — join the channel without any real mic/cam. Useful when
  // the user is on a context that can't grant permissions (preview deploys,
  // embedded webviews, when the user denied access, etc.). They still
  // appear in the voice roster and can see/hear others.
  const joinDemo = useCallback(() => {
    setError(null)
    const sock = getSocket()
    if (!sock) return
    sock.emit('voice:join', { channelId: voiceChannelRef.current })
    setMicOn(false)
    setCamOn(false)
    setJoined(true)
    setMinimized(false)
  }, [])

  function stopMedia() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
  }

  const join = useCallback(async () => {
    setError(null)
    const sock = getSocket()
    if (!sock) return
    const stream = await requestMedia({ mic: true, cam: false })
    if (!stream) return
    sock.emit('voice:join', { channelId: voiceChannelRef.current })
    setMicOn(true)
    setCamOn(false)
    setJoined(true)
    setMinimized(false)
    announce({ mic: true, cam: false })
  }, [announce])

  const leave = useCallback(() => {
    stopMedia()
    setMicOn(false)
    setCamOn(false)
    setJoined(false)
    setMinimized(false)
    setPeers([])
    const sock = getSocket()
    if (!sock) return
    sock.emit('voice:leave', { channelId: voiceChannelRef.current })
  }, [])

  const toggleMic = useCallback(async () => {
    if (!joined) return
    const next = !micOn
    if (next) {
      const stream = await requestMedia({ mic: true, cam: camOn })
      if (!stream) return
    } else {
      const s = localStreamRef.current
      if (s) s.getAudioTracks().forEach(t => t.stop())
    }
    setMicOn(next)
    announce({ mic: next, cam: camOn })
  }, [joined, micOn, camOn, announce])

  const toggleCam = useCallback(async () => {
    if (!joined) return
    const next = !camOn
    if (next) {
      const stream = await requestMedia({ mic: micOn, cam: true })
      if (!stream) return
    } else {
      const s = localStreamRef.current
      if (s) s.getVideoTracks().forEach(t => t.stop())
      if (localVideoRef.current) localVideoRef.current.srcObject = null
    }
    setCamOn(next)
    announce({ mic: micOn, cam: next })
  }, [joined, micOn, camOn, announce])

  const minimize = useCallback(() => setMinimized(true), [])
  const restore = useCallback(() => setMinimized(false), [])

  // Cleanup on socket disconnect
  useEffect(() => {
    return () => {
      stopMedia()
    }
  }, [])

  const value = {
    joined,
    micOn,
    camOn,
    peers,
    error,
    minimized,
    localStreamRef,
    localVideoRef,
    voiceChannel: voiceChannelRef.current,
    join,
    joinDemo,
    leave,
    toggleMic,
    toggleCam,
    minimize,
    restore,
    setPeers,
    announce,
  }

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

export function useVoice() {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}

function permErrorMessage(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError') return 'permiso denegado por el navegador'
  if (name === 'NotFoundError') return 'no se encontró micrófono/cámara'
  if (name === 'NotReadableError') return 'el dispositivo está siendo usado por otra app'
  return 'no se pudo acceder al dispositivo'
}
