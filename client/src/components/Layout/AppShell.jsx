import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route, Navigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { connectSocket, getSocket, disconnectSocket } from '../../services/websocket.js'
import ChannelList from '../Channels/ChannelList.jsx'
import ChannelView from '../Channels/ChannelView.jsx'
import FriendList from '../Friends/FriendList.jsx'
import Settings from '../Settings/Settings.jsx'
import Modal from '../Modal/Modal.jsx'
import './shell.css'

export default function AppShell() {
  const { channelId = 'general' } = useParams()
  const [me, setMe] = useState(api.user())
  const [channels, setChannels] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = api.token()
    if (!token) return
    let alive = true
    api.me(token).then(({ user }) => { if (alive) setMe(user) }).catch(() => confirmLogout())
    api.channels(token).then(({ channels }) => { if (alive) setChannels(channels) }).catch(() => {})
    const sock = connectSocket(token)
    sock.on('connect_error', () => confirmLogout())
    return () => { alive = false; disconnectSocket() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const sock = getSocket()
    if (!sock) return
    sock.emit('channel:join', channelId)
    return () => sock.emit('channel:leave', channelId)
  }, [channelId])

  function confirmLogout() {
    setLogoutOpen(true)
  }

  function doLogout() {
    api.clear()
    disconnectSocket()
    setLogoutOpen(false)
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="shell-rail glass">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">enclave</span>
        </div>
        <div className="divider" />
        <FriendList />
        <div className="shell-rail-foot">
          <div className="me">
            <div className="avatar">{me?.username?.[0]?.toUpperCase() || '?'}</div>
            <div className="me-info">
              <div className="me-name">{me?.username}</div>
              <div className="me-status">online</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={confirmLogout} title="cerrar sesión">↩</button>
        </div>
      </aside>

      <aside className="shell-channels glass">
        <ChannelList channels={channels} active={channelId} />
      </aside>

      <main className="shell-main glass">
        <button
          className="btn btn-ghost shell-settings-btn"
          onClick={() => setSettingsOpen(true)}
          title="ajustes"
          aria-label="ajustes"
        >
          ⚙
        </button>
        <Routes>
          <Route path=":channelId" element={<ChannelView channelId={channelId} channels={channels} me={me} />} />
          <Route path="*" element={<Navigate to="general" replace />} />
        </Routes>
      </main>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Modal
        open={logoutOpen}
        title="¿cerrar sesión?"
        sub="tendrás que volver a entrar con tu usuario y contraseña."
        onClose={() => setLogoutOpen(false)}
      >
        <div className="modal-actions">
          <button className="btn" onClick={() => setLogoutOpen(false)}>cancelar</button>
          <button className="btn btn-danger" onClick={doLogout}>cerrar sesión</button>
        </div>
      </Modal>
    </div>
  )
}
