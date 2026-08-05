const KEY = 'enclave.settings'

const DEFAULTS = {
  theme: 'dark',
  fontSize: 'md',     // 'sm' | 'md' | 'lg'
  density: 'cozy',    // 'compact' | 'cozy' | 'roomy'
  // Custom palette overrides. Each is a hex string, or null to use the theme default.
  customColors: {
    accent: null,       // primary accent (titles, active borders, send button)
    accent2: null,      // secondary accent (success, online dots, voice orb)
    ink: null,          // main text color
    ink2: null,         // secondary text
    ink3: null,         // muted text
    bg: null,           // background
    danger: null,       // danger / error
  },
  // Optional override of the glass background
  glass: null,          // { bg, border, blur } or null
  // Accessibility
  reduceMotion: false,
  compactPiP: false,
}

export const THEMES = [
  { id: 'dark',  name: 'default',  description: 'negros, glass sutil' },
  { id: 'light', name: 'claro',    description: 'blancos, glass sutil' },
  { id: 'warm',  name: 'cálido',   description: 'beige / marrón, glass sutil' },
]

export const FONT_SIZES = [
  { id: 'sm', name: 'pequeño', scale: 0.92 },
  { id: 'md', name: 'medio',   scale: 1.0 },
  { id: 'lg', name: 'grande',  scale: 1.08 },
]

export const DENSITIES = [
  { id: 'compact', name: 'compacto', lineHeight: 1.4, msgGap: 1 },
  { id: 'cozy',    name: 'cómodo',  lineHeight: 1.5, msgGap: 3 },
  { id: 'roomy',   name: 'espacioso', lineHeight: 1.65, msgGap: 6 },
]

export const COLOR_KEYS = [
  { key: 'accent',  label: 'acento',  description: 'botón enviar, bordes activos, títulos' },
  { key: 'accent2', label: 'acento 2', description: 'puntos online, voz, success' },
  { key: 'ink',     label: 'texto',   description: 'texto principal' },
  { key: 'ink2',    label: 'texto secundario', description: 'subtítulos, labels' },
  { key: 'ink3',    label: 'texto apagado',  description: 'placeholders, hints' },
  { key: 'bg',      label: 'fondo',   description: 'fondo de la app' },
  { key: 'danger',  label: 'peligro', description: 'errores, salir de llamada' },
]

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw), customColors: { ...DEFAULTS.customColors, ...(JSON.parse(raw).customColors || {}) } }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch {}
}

let _settings = null
const _listeners = new Set()

function emit() {
  for (const fn of _listeners) fn(_settings)
}

export function getSettings() {
  if (!_settings) _settings = load()
  return _settings
}

export function subscribeSettings(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

export function applySettings(settings) {
  _settings = settings
  save(settings)
  applyToDOM(settings)
  emit()
}

export function updateSetting(patch) {
  const next = { ...getSettings(), ...patch }
  if (patch.customColors) {
    next.customColors = { ..._settings.customColors, ...patch.customColors }
  }
  applySettings(next)
}

export function resetCustomColor(key) {
  const colors = { ..._settings.customColors, [key]: null }
  updateSetting({ customColors: colors })
}

export function resetAll() {
  applySettings(structuredClone(DEFAULTS))
}

// === DOM application ===
export function applyToDOM(settings) {
  const root = document.documentElement
  root.setAttribute('data-theme', settings.theme)
  root.setAttribute('data-font', settings.fontSize)
  root.setAttribute('data-density', settings.density)
  if (settings.reduceMotion) root.setAttribute('data-motion', 'reduce')
  else root.removeAttribute('data-motion')

  // Two style blocks: one for custom colors (preserved across reloads), one
  // for font-scale rem overrides that scale every meaningful text element.
  let style = document.getElementById('enclave-custom-styles')
  if (!style) {
    style = document.createElement('style')
    style.id = 'enclave-custom-styles'
    document.head.appendChild(style)
  }

  const rules = []
  // Custom color overrides
  for (const { key } of COLOR_KEYS) {
    const v = settings.customColors[key]
    if (v) rules.push(`--${key}: ${v};`)
  }
  // Font scale — multiply every significant text size by the current scale.
  // `rem` is relative to the root font-size, so we re-declare root size and
  // then reference it via rem. We set the actual root size directly here so
  // `1rem` reflects the chosen scale.
  const scale = settings.fontSize === 'sm' ? 0.9
              : settings.fontSize === 'lg' ? 1.15
              : 1.0
  const remBase = 16 * scale  // px
  rules.push(`font-size: ${remBase}px;`)
  style.textContent = `:root { ${rules.join(' ')} }`
}

export function initSettings() {
  const s = getSettings()
  applyToDOM(s)
  // React to system reduce-motion preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches && !s.reduceMotion) {
      updateSetting({ reduceMotion: true })
    }
  }
}
