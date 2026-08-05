import React, { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api.js'
import { getSocket } from '../../services/websocket.js'
import MessageList from '../Messages/MessageList.jsx'
import Composer from '../Messages/Composer.jsx'
import AIBanner from '../AI/AIBanner.jsx'
import VoicePlaceholder from '../Voice/VoicePlaceholder.jsx'
import './channels.css'

export default function ChannelView({ channelId, channels, me }) {
  const channel = channels.find((c) => c.id === channelId)
  const [messages, setMessages] = useState([])
  const tokenRef = useRef(api.token())

  // Load history when channel changes
  useEffect(() => {
    setMessages([])
    const token = api.token()
    if (!token || !channelId) return
    api.history(token, channelId)
      .then(({ messages }) => setMessages(messages))
      .catch(() => {})
  }, [channelId])

  // Subscribe to live messages. Re-subscribes on socket reconnect.
  useEffect(() => {
    const sock = getSocket()
    if (!sock || !channelId) return

    function onNew(msg) {
      if (!msg || msg.channelId !== channelId) return
      setMessages((prev) => {
        // If we sent this optimistically, replace the temp one
        if (msg._clientId) {
          const idx = prev.findIndex((m) => m.id === msg._clientId)
          if (idx !== -1) {
            const next = prev.slice()
            next[idx] = msg
            return next
          }
        }
        // Dedupe by server id
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    }

    sock.on('message:new', onNew)
    // If the socket is already connected, also join the room now
    if (sock.connected) {
      sock.emit('channel:join', channelId)
    }
    function onConnect() { sock.emit('channel:join', channelId) }
    sock.on('connect', onConnect)

    return () => {
      sock.off('message:new', onNew)
      sock.off('connect', onConnect)
      if (sock.connected) sock.emit('channel:leave', channelId)
    }
  }, [channelId])

  function sendMessage(body) {
    const sock = getSocket()
    if (!sock) return
    const clientId = 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    // Optimistic insert
    const optimistic = {
      id: clientId,
      channelId,
      authorId: tokenRef.current ? 'me' : 'me',
      authorName: me?.username || 'tú',
      body,
      createdAt: Date.now(),
      pending: true,
    }
    setMessages((m) => [...m, optimistic])
    sock.emit('message:send', { channelId, body, _clientId: clientId })
  }

  return (
    <>
      <header className="channel-header">
        <div className="channel-header-main">
          <div className={`channel-icon kind-${channel?.kind}`}>
            {channel?.kind === 'text' ? '#' : channel?.kind === 'voice' ? '~' : '✦'}
          </div>
          <div>
            <h1>{channel?.name || channelId}</h1>
            <span className="desc">{channel?.description}</span>
          </div>
        </div>
      </header>
      <div className="channel-body">
        {channel?.kind === 'ai' && <AIBanner />}
        {channel?.kind === 'voice' && <VoicePlaceholder channelId={channelId} me={me} />}
        <MessageList messages={messages} kind={channel?.kind} />
        <Composer onSend={sendMessage} disabled={channel?.kind === 'voice'} />
      </div>
    </>
  )
}
