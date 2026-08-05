import React, { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import './friends.css'

export default function FriendList() {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] })
  const [adding, setAdding] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)

  async function refresh() {
    try {
      const d = await api.friends(api.token())
      setData(d)
    } catch {}
  }

  useEffect(() => { refresh() }, [])

  async function send(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.sendFriendRequest(api.token(), username.trim())
      setUsername('')
      setAdding(false)
      refresh()
    } catch (err) { setError(err.message) }
  }

  async function accept(userId) { await api.acceptFriend(api.token(), userId); refresh() }
  async function reject(userId) { await api.rejectFriend(api.token(), userId); refresh() }

  return (
    <div className="friends">
      <div className="friends-head">
        <div className="section-title" style={{ margin: 0 }}>friends</div>
        <button className="btn btn-ghost" onClick={() => setAdding((v) => !v)} title="agregar amigo">
          {adding ? '×' : '+'}
        </button>
      </div>

      {adding && (
        <form className="add-form" onSubmit={send}>
          <input
            className="input"
            placeholder="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">enviar</button>
          {error && <div className="add-error">{error}</div>}
        </form>
      )}

      {data.incoming.length > 0 && (
        <div className="friends-section">
          <div className="friends-label">requests · {data.incoming.length}</div>
          {data.incoming.map((u) => (
            <div key={u.id} className="friend-row request">
              <div className="avatar small">{(u.username || '?')[0].toUpperCase()}</div>
              <div className="friend-name">{u.username}</div>
              <div className="friend-actions">
                <button className="btn btn-ghost small" onClick={() => accept(u.id)}>accept</button>
                <button className="btn btn-ghost small" onClick={() => reject(u.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="friends-section">
        <div className="friends-label">online · {data.friends.length}</div>
        {data.friends.length === 0 && (
          <div className="dim friends-empty">sin amigos aún</div>
        )}
        {data.friends.map((u) => (
          <div key={u.id} className="friend-row">
            <div className="avatar small">{(u.username || '?')[0].toUpperCase()}</div>
            <div className="friend-name">{u.username}</div>
            <span className="online-dot" title="online" />
          </div>
        ))}
      </div>
    </div>
  )
}
