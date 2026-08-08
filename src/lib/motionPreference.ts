export type MotionPreference = 'reduced' | 'full'

const STORAGE_KEY = 'motion-preference'
const listeners = new Set<() => void>()

/**
 * The visitor's explicit choice, or null when they have not made one (in which
 * case the OS setting decides on its own). Cached so getSnapshot is cheap and
 * referentially stable for useSyncExternalStore.
 */
let cached: MotionPreference | null = read()

function read(): MotionPreference | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'reduced' || value === 'full' ? value : null
  } catch {
    // Storage blocked (private mode, embedded, cookies off). The preference
    // just won't persist — never let that break the page.
    return null
  }
}

function emit() {
  listeners.forEach((listener) => listener())
}

function onStorage(event: StorageEvent) {
  // key === null means localStorage.clear(); anything else we can filter.
  if (event.key !== null && event.key !== STORAGE_KEY) return
  cached = read()
  emit()
}

/** Listener is attached only while something is subscribed. */
export function subscribeMotionPreference(onChange: () => void) {
  listeners.add(onChange)
  if (listeners.size === 1) window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

export function getMotionPreference(): MotionPreference | null {
  return cached
}

export function setMotionPreference(value: MotionPreference | null) {
  cached = value
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Non-persistent for this session only.
  }
  emit()
}
