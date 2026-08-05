import jwt from 'jsonwebtoken'
import * as Users from '../models/User.js'
import { getChannel } from '../models/Message.js'
import { registerHandlers } from './eventHandlers.js'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function setupSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('no token'))
    try {
      const payload = jwt.verify(token, SECRET)
      const user = Users.findById(payload.sub)
      if (!user) return next(new Error('invalid user'))
      socket.user = user
      next()
    } catch {
      next(new Error('bad token'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.user
    socket.join(`user:${user.id}`)
    socket.on('channel:join', (channelId) => socket.join(`chan:${channelId}`))
    socket.on('channel:leave', (channelId) => socket.leave(`chan:${channelId}`))

    socket.on('voice:join', ({ channelId }) => {
      if (getChannel(channelId)?.kind !== 'voice') return
      socket.join(`chan:${channelId}`)
      const payload = {
        userId: user.id,
        username: user.username,
        muted: true,
        speaking: false,
        camera: false,
        joined: true,
        self: true,
      }
      socket.emit('voice:state', payload)
      socket.to(`chan:${channelId}`).emit('voice:state', { ...payload, self: false })
    })
    socket.on('voice:leave', ({ channelId }) => {
      if (getChannel(channelId)?.kind !== 'voice') return
      socket.to(`chan:${channelId}`).emit('voice:leave', { userId: user.id })
      socket.leave(`chan:${channelId}`)
    })

    registerHandlers(io, socket)
  })
}
