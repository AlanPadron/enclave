const TOKEN_KEY = 'enclave.token'
const USER_KEY = 'enclave.user'

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'request failed' }))
    throw new Error(err.error || 'request failed')
  }
  return res.json()
}

export const api = {
  token: () => localStorage.getItem(TOKEN_KEY),
  user: () => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setSession({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  me: (token) => request('/me', { token }),
  channels: (token) => request('/channels', { token }),
  history: (token, channelId, limit = 50) =>
    request(`/channels/${channelId}/messages?limit=${limit}`, { token }),
  friends: (token) => request('/friends', { token }),
  sendFriendRequest: (token, username) =>
    request('/friends/request', { method: 'POST', body: { username }, token }),
  acceptFriend: (token, userId) =>
    request('/friends/accept', { method: 'POST', body: { userId }, token }),
  rejectFriend: (token, userId) =>
    request('/friends/reject', { method: 'POST', body: { userId }, token }),
}
