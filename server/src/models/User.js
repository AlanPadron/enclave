import crypto from 'crypto'

// In-memory user store for the sketch. Replace with Mongoose when ready.
const users = new Map()
const usernameIndex = new Map()

export function findById(id) { return users.get(id) || null }
export function findByUsername(username) {
  return usernameIndex.get(username.toLowerCase()) || null
}
export function findManyByIds(ids) {
  return ids.map((id) => users.get(id)).filter(Boolean)
}

export function create({ username, passwordHash }) {
  const id = crypto.randomUUID()
  const user = {
    id,
    username,
    passwordHash,
    createdAt: Date.now(),
    friends: [],
    incoming: [],
    outgoing: [],
    status: 'online',
  }
  users.set(id, user)
  usernameIndex.set(username.toLowerCase(), user)
  return user
}

export function sendRequest(fromId, toId) {
  const from = users.get(fromId)
  const to = users.get(toId)
  if (!from || !to) return null
  if (from.friends.includes(toId) || to.incoming.includes(fromId)) return 'exists'
  from.outgoing.push(toId)
  to.incoming.push(fromId)
  return 'sent'
}

export function acceptRequest(currentId, fromId) {
  const me = users.get(currentId)
  const other = users.get(fromId)
  if (!me || !other) return null
  if (!me.incoming.includes(fromId)) return 'no-request'
  me.incoming = me.incoming.filter((id) => id !== fromId)
  other.outgoing = other.outgoing.filter((id) => id !== currentId)
  if (!me.friends.includes(fromId)) me.friends.push(fromId)
  if (!other.friends.includes(currentId)) other.friends.push(currentId)
  return 'accepted'
}

export function rejectRequest(currentId, fromId) {
  const me = users.get(currentId)
  const other = users.get(fromId)
  if (!me || !other) return null
  me.incoming = me.incoming.filter((id) => id !== fromId)
  if (other) other.outgoing = other.outgoing.filter((id) => id !== currentId)
  return 'rejected'
}

export function publicProfile(user) {
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    status: user.status,
    friends: user.friends,
  }
}
