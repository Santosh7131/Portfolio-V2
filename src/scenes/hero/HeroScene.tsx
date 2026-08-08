import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import './hero.css'

/** Scroll length in animated mode — MUST equal this scene's registry height. */
const TRACK_HEIGHT = '170svh'

/**
 * The cover. One motion beat, played on load rather than scrubbed: the name
 * rises from behind its own baseline while its optical size and weight settle,
 * then the rail draws and the supporting type arrives. The scroll-out is a
 * separate scrubbed trigger that animates the WRAPPER, so it can never contend
 * with the entrance tweens running on the children.
 *
 * This scene is eager (see registry): it renders in the shell chunk so the
 * first frame is the cover, never an empty reserved box.
 */
export default function HeroScene({ id }: SceneProps) {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    () => {
      // Static contract: no entrance, no scroll-out. The markup below is
      // already the finished cover and is readable from the first frame.
      if (isStatic) return

      const name = stage.current?.querySelector<HTMLElement>('.hr-name')
      const axis = { opsz: 144, wght: 350 }
      let cancelled = false

      // Held until the display face is actually available: a masked type
      // reveal that swaps fonts mid-rise reads as a bug. Fraunces is
      // preloaded, so in practice this resolves before first paint.
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })

      intro
        .from('.hr-name-word', { yPercent: 115, duration: 1.05, ease: 'expo.out' }, 0)
        .from(
          axis,
          {
            opsz: 96,
            wght: 292,
            duration: 1.05,
            ease: 'power2.out',
            onUpdate: () => {
              name?.style.setProperty('--hr-opsz', axis.opsz.toFixed(1))
              name?.style.setProperty('--hr-wght', axis.wght.toFixed(0))
            },
          },
          0,
        )
        .from('.hr-rail', { scaleX: 0, duration: 0.8 }, 0.28)
        .from(
          ['.hr-role', '.hr-place'],
          { y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.06 },
          0.42,
        )
        .from('.hr-line', { y: 14, autoAlpha: 0, duration: 0.6 }, 0.54)
        .from('.hr-cue', { autoAlpha: 0, duration: 0.6 }, 0.78)

      document.fonts.ready.then(() => {
        if (!cancelled) intro.play()
      })

      // Scroll-out: the cover lifts and dissolves as the pin releases.
      const exit = gsap.timeline({
        scrollTrigger: {
          trigger: track.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          pin: stage.current,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      exit
        .to({}, { duration: 0.5 }, 0)
        .to('.hr-inner', { yPercent: -8, autoAlpha: 0, ease: 'none', duration: 0.5 }, 0.5)

      return () => {
        cancelled = true
        name?.style.removeProperty('--hr-opsz')
        name?.style.removeProperty('--hr-wght')
      }
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  return (
    <section
      ref={track}
      id={id}
      className="scene-track hr-scene"
      data-static={isStatic ? '' : undefined}
      style={{ height: isStatic ? 'auto' : TRACK_HEIGHT }}
    >
      <div ref={stage} className="scene-stage">
        <div className="hr-inner">
          <p className="hr-role">Machine learning engineer</p>
          <p className="hr-place">Chennai, India</p>
          <span className="hr-rail" aria-hidden="true" />

          <h1 className="hr-name">
            {/* The mask is the baseline the word rises from. */}
            <span className="hr-name-mask">
              <span className="hr-name-word">Santosh</span>
            </span>
          </h1>

          <p className="hr-line">
            Machine learning that runs on ordinary hardware.
          </p>

          <div className="hr-cue">
            <span className="hr-cue-tick" aria-hidden="true" />
            <p className="hr-cue-label">Profile · Work · Craft</p>
          </div>
        </div>
      </div>
    </section>
  )
}
