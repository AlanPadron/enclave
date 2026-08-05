import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Intro from './components/Intro/Intro.jsx'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'
import AppShell from './components/Layout/AppShell.jsx'
import { api } from './services/api.js'
import './components/Auth/auth.css'

export default function App() {
  const [introDone, setIntroDone] = useState(false)
  const [bootReady, setBootReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Defer "ready" until React has rendered + fonts likely loaded.
    const ready = () => setBootReady(true)
    if (document.readyState === 'complete') ready()
    else window.addEventListener('load', ready, { once: true })
    // Safety net so intro never blocks the app past 2.5s.
    const t = setTimeout(ready, 2500)
    return () => clearTimeout(t)
  }, [])

  const token = api.token()

  return (
    <>
      {!introDone && (
        <Intro ready={bootReady} onDone={() => setIntroDone(true)} />
      )}
      {introDone && (
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/app" /> : <Login />} />
          <Route path="/register" element={token ? <Navigate to="/app" /> : <Register />} />
          <Route
            path="/app/*"
            element={token ? <AppShell /> : <Navigate to="/login" />}
          />
          <Route
            path="*"
            element={<Navigate to={token ? '/app' : '/login'} />}
          />
        </Routes>
      )}
    </>
  )
}
