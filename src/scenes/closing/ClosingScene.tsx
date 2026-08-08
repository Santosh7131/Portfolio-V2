import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import './closing.css'

/** MUST equal this scene's registry height. */
const TRACK_HEIGHT = '100svh'

/*
 * The résumé is the redacted build produced by scripts/build-resume.py — never
 * the copy in Context/, which carries a mobile number and a personal email.
 * scripts/verify-resume.py is what proves the published file is clean; run it
 * before shipping a rebuilt PDF.
 */
const LINKS = [
  { label: 'GitHub', href: 'https://github.com/Santosh7131', file: false },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/santosh7131/', file: false },
  { label: 'Résumé', href: '/assets/Santosh-Kumaar-Resume.pdf', file: true },
]

/**
 * The back cover — bookend to the hero, which it inverts: the hero opens with
 * the rail on top and the cue at the bottom, this closes with the display line
 * high and the rail on the floor.
 *
 * Deliberately NOT pinned. Every other scene pins a stage inside a taller
 * track and releases at the end; as the LAST scene that would leave the
 * track's remaining length as dead runway below the release point. Instead the
 * track is exactly one viewport and the settle is scrubbed on approach, so the
 * document ends flush with the scene — nothing to release, nothing after it.
 */
export default function ClosingScene({ id }: SceneProps) {
  const track = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    () => {
      // Static contract: no timeline. The markup is already the finished back
      // cover, and both links are fully usable from the first frame.
      if (isStatic) return

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: track.current,
          // Settles on approach and is done before the document bottom, so the
          // ending is a resolution rather than something still in motion.
          start: 'top 90%',
          end: 'top 20%',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      tl.from('.cl-line-part', { y: 26, autoAlpha: 0, duration: 0.2, stagger: 0.06 }, 0)
        .from('.cl-link-row', { y: 18, autoAlpha: 0, duration: 0.18, stagger: 0.07 }, 0.22)
        .from('.cl-link-rule', { scaleX: 0, duration: 0.22, stagger: 0.07 }, 0.24)
        .from('.cl-rail-line', { scaleX: 0, duration: 0.2 }, 0.46)
        .from('.cl-rail-text', { autoAlpha: 0, duration: 0.18, stagger: 0.05 }, 0.52)
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  return (
    <section
      ref={track}
      id={id}
      className="scene-track cl-scene"
      data-static={isStatic ? '' : undefined}
      style={{ height: isStatic ? 'auto' : TRACK_HEIGHT }}
    >
      <div className="scene-stage">
        <div className="cl-inner">
          <h2 className="cl-line">
            <span className="cl-line-part">Now you know</span>
            <span className="cl-line-part">where to find me.</span>
          </h2>

          <ul className="cl-links">
            {LINKS.map((link) => (
              <li key={link.label} className="cl-link-row">
                <a
                  className="cl-link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...(link.file ? { download: '', 'data-file': '' } : null)}
                >
                  <span className="cl-link-rule" aria-hidden="true" />
                  <span className="cl-link-label">{link.label}</span>
                  {/* The mark states which of the two things the row does. */}
                  <span className="cl-link-mark" aria-hidden="true">
                    {link.file ? '↓' : '↗'}
                  </span>
                  {/* Announced, not shown. */}
                  <span className="cl-sr">
                    {link.file ? '(PDF, downloads)' : '(opens in a new tab)'}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="cl-rail">
            <span className="cl-rail-line" aria-hidden="true" />
            <p className="cl-rail-text cl-role">Machine learning engineer</p>
            <p className="cl-rail-text cl-place">Chennai, India</p>
          </div>
        </div>
      </div>
    </section>
  )
}
