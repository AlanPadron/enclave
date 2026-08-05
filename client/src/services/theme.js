const KEY = 'enclave.theme'

export const THEMES = [
  { id: 'dark',  name: 'default',  description: 'negros, glass sutil' },
  { id: 'light', name: 'claro',    description: 'blancos, glass sutil' },
  { id: 'warm',  name: 'cálido',   description: 'beige / marrón, glass sutil' },
]

export function getTheme() {
  const t = localStorage.getItem(KEY)
  return THEMES.find(x => x.id === t)?.id || 'dark'
}

export function applyTheme(id) {
  const valid = THEMES.find(x => x.id === id)
  if (!valid) return
  document.documentElement.setAttribute('data-theme', id)
  localStorage.setItem(KEY, id)
}

export function initTheme() {
  applyTheme(getTheme())
}
