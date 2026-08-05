import crypto from 'crypto'

// In-memory message store keyed by channel id. Replace with Mongo when ready.
const byChannel = new Map()
const CHANNELS = {
  general: { id: 'general', name: 'general', kind: 'text', description: 'Principal' },
  'voice-lounge': { id: 'voice-lounge', name: 'voice-lounge', kind: 'voice', description: 'Voz (placeholder)' },
  'ai-sage': { id: 'ai-sage', name: 'ai-sage', kind: 'ai', description: 'Agente IA (no conectado)' },
}

export function listChannels() {
  return Object.values(CHANNELS)
}

export function getChannel(id) {
  return CHANNELS[id] || null
}

export function listMessages(channelId, limit = 50) {
  const list = byChannel.get(channelId) || []
  return list.slice(-limit)
}

export function addMessage({ channelId, authorId, authorName, body }) {
  const msg = {
    id: crypto.randomUUID(),
    channelId,
    authorId,
    authorName,
    body,
    createdAt: Date.now(),
  }
  const list = byChannel.get(channelId) || []
  list.push(msg)
  byChannel.set(channelId, list)
  return msg
}
