import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMediaQuery } from '../lib/useMediaQuery'
import './arcade.css'

/*
 * Hidden arcade. NOT a scene: absent from the registry and from the scroll
 * journey, reachable only by the three doors (see ArcadeDoor).
 *
 * js-dos is GPL-2.0 and ships no module entry — it is built assets meant to be
 * served, not bundled. Loading it from the vendor CDN at click time keeps GPL
 * code out of this repo's bundle entirely and makes the "nothing before an
 * explicit launch" requirement true by construction rather than by discipline.
 */
const JSDOS_CSS = 'https://v8.js-dos.com/latest/js-dos.css'
const JSDOS_JS = 'https://v8.js-dos.com/latest/js-dos.js'
const BUNDLE = '/assets/doom-shareware.jsdos'

type DosInstance = { stop?: () => Promise<void> | void }
declare global {
  interface Window {
    Dos?: (el: HTMLElement, options: Record<string, unknown>) => DosInstance
  }
}

function loadOnce(tag: 'script' | 'link', url: string) {
  return new Promise<void>((resolve, reject) => {
    const sel = tag === 'script' ? `script[src="${url}"]` : `link[href="${url}"]`
    if (document.querySelector(sel)) return resolve()
    const el = document.createElement(tag)
    if (tag === 'script') {
      ;(el as HTMLScriptElement).src = url
      ;(el as HTMLScriptElement).async = true
    } else {
      ;(el as HTMLLinkElement).rel = 'stylesheet'
      ;(el as HTMLLinkElement).href = url
    }
    el.addEventListener('load', () => resolve())
    el.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)))
    document.head.appendChild(el)
  })
}

type Status = 'idle' | 'loading' | 'running' | 'error'

export default function ArcadeRoute() {
  const navigate = useNavigate()
  const isSmall = useMediaQuery('(max-width: 900px)')
  const isCoarse = useMediaQuery('(pointer: coarse)')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const hostRef = useRef<HTMLDivElement>(null)
  const dosRef = useRef<DosInstance | null>(null)

  const exit = useCallback(() => navigate('/'), [navigate])

  // Escape always gets you out — the container must never feel like a trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit])

  // Tear the emulator down on unmount; it owns a worker and an audio context.
  useEffect(
    () => () => {
      try {
        dosRef.current?.stop?.()
      } catch {
        // Already gone — nothing to reclaim.
      }
      dosRef.current = null
    },
    [],
  )

  const launch = async () => {
    if (status === 'loading' || status === 'running') return
    setStatus('loading')
    try {
      await Promise.all([loadOnce('link', JSDOS_CSS), loadOnce('script', JSDOS_JS)])
      if (!window.Dos) throw new Error('js-dos did not initialise')
      if (!hostRef.current) throw new Error('No container')
      dosRef.current = window.Dos(hostRef.current, {
        url: BUNDLE,
        theme: 'dark',
        autoStart: true,
        noCloud: true,
      })
      setStatus('running')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  const tooSmall = isSmall || isCoarse

  return (
    <div className="ar-root">
      {/* First focusable element: leaving is always the easiest thing to do. */}
      <header className="ar-bar">
        <button type="button" className="ar-exit" onClick={exit}>
          ← Back to the site
        </button>
        <p className="ar-kicker">Secret · Arcade</p>
      </header>

      <main className="ar-stage">
        {status !== 'running' && (
          <div className="ar-card">
            <p className="ar-eyebrow">You found it</p>
            <h1 className="ar-title">Knee-Deep in the Dead</h1>
            <p className="ar-blurb">
              DOOM, shareware episode one, running on a DOS emulator in this tab.
              Nothing here loads until you ask for it.
            </p>

            {tooSmall ? (
              <p className="ar-note" role="status">
                Best on a desktop with a keyboard — a DOS emulator and an FPS
                with touch controls is a poor trade. Come back on a bigger
                screen.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="ar-coin"
                  onClick={launch}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Loading…' : 'Insert coin'}
                </button>
                <p className="ar-hint">
                  Arrows move · <kbd>Ctrl</kbd> fire · <kbd>Space</kbd> use ·{' '}
                  <kbd>Esc</kbd> leaves the arcade
                </p>
              </>
            )}

            {status === 'error' && (
              <p className="ar-error" role="alert">
                Couldn’t start the emulator: {error}
              </p>
            )}
          </div>
        )}

        {/* js-dos mounts here. Kept in the tree so the ref exists at launch. */}
        <div
          ref={hostRef}
          className="ar-dos"
          data-active={status === 'running' ? '' : undefined}
          aria-label="DOOM shareware, running in a DOS emulator"
        />
      </main>

      <footer className="ar-legal">
        <p>
          DOOM® shareware © 1993 id Software. Distributed under id’s shareware
          licence, free of charge and unmodified; the original{' '}
          <code>LICENSE.DOC</code> and <code>VENDOR.DOC</code> ship inside the
          bundle. Not affiliated with or endorsed by id Software or ZeniMax.
          Emulation by <a href="https://js-dos.com">js-dos</a> (GPL-2.0), loaded
          from its own CDN.
        </p>
      </footer>
    </div>
  )
}
