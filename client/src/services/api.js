const TOKEN_KEY = 'enclave.token'
const USER_KEY = 'enclave.user'

// Thrown on non-2xx responses. `status` is the HTTP status code (0 if network error).
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', body, token, auth = true } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? authHeader(token) : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new ApiError(err.message || 'network error', 0, null)
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: 'request failed' }))
    const err = new ApiError(errBody.error || 'request failed', res.status, errBody)
    // 401 means the session is dead. Tell the app so it can boot the user
    // back to the login screen without leaving them stuck on a half-broken UI.
    if (res.status === 401) {
      try { window.dispatchEvent(new CustomEvent('enclave:session-expired', { detail: { reason: errBody.error } })) } catch {}
    }
    throw err
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
  createChannel: (token, payload) =>
    request('/channels', { method: 'POST', body: payload, token }),
  inviteToChannel: (token, channelId, userId) =>
    request(`/channels/${channelId}/invite`, { method: 'POST', body: { userId }, token }),
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
