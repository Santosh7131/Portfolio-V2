import { useSyncExternalStore } from 'react'
import { useMediaQuery } from './useMediaQuery'
import {
  getMotionPreference,
  setMotionPreference,
  subscribeMotionPreference,
} from './motionPreference'

const OS_QUERY = '(prefers-reduced-motion: reduce)'

function useStoredPreference() {
  return useSyncExternalStore(subscribeMotionPreference, getMotionPreference)
}

/**
 * The single source of truth for motion across the site: the OS setting OR the
 * on-page toggle. An OS preference for reduced motion always wins — the toggle
 * can take motion away, never force it back on.
 *
 * Backed by useSyncExternalStore rather than context, so every existing caller
 * (SmoothScroll, LazyScene, all five scenes) picks this up with no plumbing.
 */
export function usePrefersReducedMotion(): boolean {
  const osReduced = useMediaQuery(OS_QUERY)
  const stored = useStoredPreference()
  return osReduced || stored === 'reduced'
}

/** State and control for the on-page toggle itself. */
export function useMotionPreference() {
  const osReduced = useMediaQuery(OS_QUERY)
  const stored = useStoredPreference()
  return {
    reduced: osReduced || stored === 'reduced',
    /** OS says reduce, so the toggle cannot re-enable motion. */
    osLocked: osReduced,
    setReduced: (next: boolean) => setMotionPreference(next ? 'reduced' : 'full'),
  }
}
