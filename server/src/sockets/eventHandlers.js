import { addMessage, getChannel } from '../models/Message.js'

const AI_OFFLINE = '[AI no conectado — espacio reservado para el agente]'

export function registerHandlers(io, socket) {
  const user = socket.user

  socket.on('message:send', ({ channelId, body }) => {
    const channel = getChannel(channelId)
    if (!channel || !body || !body.trim()) return

    if (channel.kind === 'ai') {
      const userMsg = addMessage({
        channelId,
        authorId: user.id,
        authorName: user.username,
        body: body.trim(),
      })
      io.to(`chan:${channelId}`).emit('message:new', userMsg)
      // Placeholder echo so the channel isn't dead.
      const reply = addMessage({
        channelId,
        authorId: 'ai',
        authorName: 'sage',
        body: AI_OFFLINE,
      })
      setTimeout(() => io.to(`chan:${channelId}`).emit('message:new', reply), 400)
      return
    }

    const msg = addMessage({
      channelId,
      authorId: user.id,
      authorName: user.username,
      body: body.trim(),
    })
    io.to(`chan:${channelId}`).emit('message:new', msg)
  })

  socket.on('voice:state', ({ channelId, muted, speaking, camera }) => {
    if (getChannel(channelId)?.kind !== 'voice') return
    socket.to(`chan:${channelId}`).emit('voice:state', {
      userId: user.id,
      username: user.username,
      muted: !!muted,
      speaking: !!speaking,
      camera: !!camera,
    })
  })
}
