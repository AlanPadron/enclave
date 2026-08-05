import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route, Navigate } from 'react-router-dom'
import { api, ApiError } from '../../services/api.js'
import { connectSocket, getSocket, disconnectSocket } from '../../services/websocket.js'
import { useVoice } from '../../services/voice.jsx'
import ChannelList from '../Channels/ChannelList.jsx'
import ChannelView from '../Channels/ChannelView.jsx'
import FriendList from '../Friends/FriendList.jsx'
import Settings from '../Settings/Settings.jsx'
import Modal from '../Modal/Modal.jsx'
import VoicePiP from '../Voice/VoicePiP.jsx'
import MobileTopBar from './MobileTopBar.jsx'
import './shell.css'

export default function AppShell() {
  const { channelId = 'general' } = useParams()
  const [me, setMe] = useState(api.user())
  const [channels, setChannels] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [channelsOpen, setChannelsOpen] = useState(false)
  const voice = useVoice()
  const navigate = useNavigate()

  useEffect(() => {
    const token = api.token()
    if (!token) return
    let alive = true
    api.me(token)
      .then(({ user }) => { if (alive) setMe(user) })
      .catch((err) => {
        if (alive && err instanceof ApiError && err.status === 401) {
          setSessionExpired(true)
        }
      })
    api.channels(token).then(({ channels }) => { if (alive) setChannels(channels) }).catch(() => {})
    const sock = connectSocket(token)
    sock.on('connect_error', () => confirmLogout())
    return () => { alive = false; disconnectSocket() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Allow ChannelList to ask us to refresh channels without a full reload
  useEffect(() => {
    function onRefresh(e) {
      const ch = e.detail?.channels
      if (Array.isArray(ch) && ch.length) setChannels(ch)
    }
    window.addEventListener('enclave:refresh-channels', onRefresh)
    return () => window.removeEventListener('enclave:refresh-channels', onRefresh)
  }, [])

  useEffect(() => {
    const sock = getSocket()
    if (!sock) return
    sock.emit('channel:join', channelId)
    return () => sock.emit('channel:leave', channelId)
  }, [channelId])

  function askLogout() {
    setLogoutOpen(true)
  }

  function doLogout() {
    api.clear()
    disconnectSocket()
    setLogoutOpen(false)
    navigate('/login')
  }

  function ackSessionExpired() {
    api.clear()
    setSessionExpired(false)
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
          <button className="btn btn-ghost" onClick={askLogout} title="cerrar sesión">↩</button>
        </div>
      </aside>

      <aside className="shell-channels glass">
        <ChannelList channels={channels} active={channelId} />
      </aside>

      <main className={`shell-main glass ${voice.joined && voice.minimized ? 'with-pip' : ''}`}>
        <MobileTopBar
          channelName={channels.find((c) => c.id === channelId)?.name || channelId}
          onOpenFriends={() => setFriendsOpen(true)}
          onOpenChannels={() => setChannelsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
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

      {/* Mobile drawers */}
      <div className={`mobile-drawer ${friendsOpen ? 'open' : ''}`} onClick={() => setFriendsOpen(false)}>
        <aside className="mobile-drawer-panel glass" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-head">
            <span className="brand-name">friends</span>
            <button className="btn btn-ghost" onClick={() => setFriendsOpen(false)} aria-label="cerrar">×</button>
          </div>
          <div className="divider" />
          <FriendList />
        </aside>
      </div>
      <div className={`mobile-drawer ${channelsOpen ? 'open' : ''}`} onClick={() => setChannelsOpen(false)}>
        <aside className="mobile-drawer-panel glass" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-head">
            <span className="brand-name">channels</span>
            <button className="btn btn-ghost" onClick={() => setChannelsOpen(false)} aria-label="cerrar">×</button>
          </div>
          <div className="divider" />
          <ChannelList channels={channels} active={channelId} onPick={() => setChannelsOpen(false)} />
        </aside>
      </div>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <VoicePiP />

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

      <Modal
        open={sessionExpired}
        title="sesión expirada"
        sub="vuelve a iniciar sesión para continuar."
        onClose={ackSessionExpired}
      >
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={ackSessionExpired}>entrar</button>
        </div>
      </Modal>
    </div>
  )
}
