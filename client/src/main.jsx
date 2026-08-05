import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { initSettings } from './services/theme.js'
import './styles/global.css'

initSettings()

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

// Register service worker (PWA + offline shell)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('[sw] register failed', err))
  })
}

// Mount the install prompt in a parallel React tree so it lives outside the
// app's routing/transitions and survives remounts.
function mountInstallPrompt() {
  let host = document.getElementById('enclave-install-host')
  if (!host) {
    host = document.createElement('div')
    host.id = 'enclave-install-host'
    document.body.appendChild(host)
  }
  import('./services/installPrompt.jsx').then(({ default: InstallPrompt }) => {
    ReactDOM.createRoot(host).render(<InstallPrompt />)
  })
}

mountInstallPrompt()
