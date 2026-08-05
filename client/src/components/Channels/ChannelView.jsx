import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    const token = api.token()
    if (!token || !channelId) return
    setMessages([])
    api.history(token, channelId).then(({ messages }) => setMessages(messages)).catch(() => {})
  }, [channelId])

  useEffect(() => {
    const sock = getSocket()
    if (!sock) return
    function onNew(msg) {
      if (msg.channelId !== channelId) return
      setMessages((m) => [...m, msg])
    }
    sock.on('message:new', onNew)
    return () => sock.off('message:new', onNew)
  }, [channelId])

  function sendMessage(body) {
    const sock = getSocket()
    if (!sock) return
    sock.emit('message:send', { channelId, body })
  }

  return (
    <>
      <header className="channel-header">
        <h1># {channel?.name || channelId}</h1>
        <span className="desc">{channel?.description}</span>
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
