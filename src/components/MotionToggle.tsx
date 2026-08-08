import { useId } from 'react'
import { useMotionPreference } from '../lib/usePrefersReducedMotion'
import './MotionToggle.css'

/**
 * Site-level motion control. Lives in the shell (fixed, outside the registry)
 * so it is reachable at any scroll position.
 *
 * role="switch" + aria-checked is the correct semantic for an on/off setting
 * and announces its own state changes on activation — deliberately no
 * aria-live region, which would announce the same change a second time.
 *
 * When the OS asks for reduced motion the switch is aria-disabled rather than
 * `disabled`: it stays focusable and carries a description explaining why it
 * cannot be turned back on, which beats a control that silently does nothing.
 */
export default function MotionToggle() {
  const { reduced, osLocked, setReduced } = useMotionPreference()
  const noteId = useId()
  const motionOn = !reduced

  return (
    <div className="mt-root">
      <button
        type="button"
        role="switch"
        aria-checked={motionOn}
        aria-label="Motion"
        aria-disabled={osLocked || undefined}
        aria-describedby={osLocked ? noteId : undefined}
        title={osLocked ? 'Motion is off in your system settings' : 'Motion'}
        className="mt-switch"
        onClick={() => {
          if (!osLocked) setReduced(motionOn)
        }}
      >
        <span className="mt-glyph" aria-hidden="true">
          <span className="mt-bar" />
          <span className="mt-bar" />
          <span className="mt-bar" />
        </span>
      </button>
      {osLocked && (
        <span id={noteId} className="mt-note" role="note">
          Motion is off in your system settings.
        </span>
      )}
    </div>
  )
}
