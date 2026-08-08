import { useEffect } from 'react'
import { useNavigate } from 'react-router'

/**
 * The way in. Renders nothing and never appears in the scroll journey.
 *
 * Two doors live here — type the old Doom cheat `idkfa` anywhere, or read the
 * console — and a third is simply that /arcade is a real route once you know
 * it exists. Between them a curious person finds it; nobody else is
 * interrupted.
 */
const SEQUENCE = 'idkfa'

export default function ArcadeDoor() {
  const navigate = useNavigate()

  useEffect(() => {
    // For the people who open devtools first.
    console.log(
      '%c↯ idkfa',
      'color:#a78bfa;font:600 13px ui-monospace,monospace;letter-spacing:.14em',
      '\nType it anywhere on the page. Or just go to /arcade.',
    )
  }, [])

  useEffect(() => {
    let buffer = ''
    const onKey = (event: KeyboardEvent) => {
      // Never swallow real typing — the design-system scene has a text field.
      const el = event.target as HTMLElement | null
      if (
        el &&
        (el.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
      ) {
        return
      }
      if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      buffer = (buffer + event.key.toLowerCase()).slice(-SEQUENCE.length)
      if (buffer === SEQUENCE) {
        buffer = ''
        navigate('/arcade')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return null
}
