import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (username.startsWith(' ') || username.endsWith(' ')) {
      return setError('sin espacios al inicio o al final del username')
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return setError('sin espacios al inicio o al final del password')
    }
    setLoading(true)
    try {
      const { token, user } = await api.login(username, password)
      api.setSession({ token, user })
      navigate('/app')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="glass-strong auth-card" onSubmit={submit}>
        <div className="auth-title">welcome back</div>
        <div className="auth-sub muted">entra a enclave</div>
        <div className="divider" />
        <label className="label">username</label>
        <input
          className="input"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div style={{ height: 10 }} />
        <label className="label">password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="auth-error">{error}</div>}
        <button className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'entering…' : 'enter'}
        </button>
        <div className="auth-foot muted">
          sin cuenta? <a href="/register">regístrate</a>
        </div>
      </form>
    </div>
  )
}
