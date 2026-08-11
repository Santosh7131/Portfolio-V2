import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import './editorial.css'

/** Scroll length in animated mode — MUST equal this scene's registry height. */
const TRACK_HEIGHT = '260svh'

/**
 * Scene 3 — Visual & type. An art-directed opening spread; the still frame is
 * the deliverable, so motion stays quiet and secondary. Pure DOM/CSS type: no
 * physics, no WebGL.
 *
 * The headline's optical-size/weight settle is driven through two custom
 * properties rather than an inline font-variation-settings string, so the
 * settled value lives in CSS (the var() fallbacks) and GSAP only ever writes
 * the transient part. Headline line breaks are authored, not left to wrapping —
 * an art director sets their own breaks, and it keeps the axis settle from
 * reflowing the text.
 */
export default function EditorialScene({ id }: SceneProps) {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    () => {
      // Static contract: create nothing. The markup and CSS below already are
      // the finished spread — the deliverable, not a pre-animation state.
      if (isStatic) return

      const headline = stage.current?.querySelector<HTMLElement>('.ed-headline')
      // Settled axis values; the tween runs `from` a lighter, lower-contrast cut.
      const axis = { opsz: 144, wght: 340 }

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
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

      tl.from('.ed-kicker', { y: 14, autoAlpha: 0, duration: 0.08 }, 0)
        .from(
          '.ed-headline-line',
          { y: 34, autoAlpha: 0, duration: 0.13, stagger: 0.045 },
          0.04,
        )
        .from('.ed-standfirst', { y: 14, autoAlpha: 0, duration: 0.09 }, 0.18)
        .from(
          '.ed-body > p',
          { y: 16, autoAlpha: 0, duration: 0.1, stagger: 0.05 },
          0.24,
        )
        .from('.ed-quote-rule', { scaleX: 0, duration: 0.08 }, 0.36)
        .from('.ed-quote', { y: 18, autoAlpha: 0, duration: 0.11 }, 0.38)
        .from('.ed-rule', { scaleX: 0, duration: 0.12 }, 0.44)
        .from(
          '.ed-colophon > *',
          { y: 12, autoAlpha: 0, duration: 0.09, stagger: 0.04 },
          0.5,
        )
        // The type focuses as it arrives: a touch more optical contrast and
        // weight. Authored line breaks mean this can't re-wrap anything.
        .from(
          axis,
          {
            opsz: 116,
            wght: 296,
            duration: 0.2,
            ease: 'none',
            onUpdate: () => {
              headline?.style.setProperty('--ed-opsz', axis.opsz.toFixed(1))
              headline?.style.setProperty('--ed-wght', axis.wght.toFixed(0))
            },
          },
          0.04,
        )
        // Settled reading beat: pinned and composed for the rest of the track.
        .to({}, { duration: 0.42 }, 0.58)

      return () => {
        // Hand the axes back to CSS — GSAP can't revert a property it never
        // owned as a tween target.
        headline?.style.removeProperty('--ed-opsz')
        headline?.style.removeProperty('--ed-wght')
      }
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  return (
    <section
      ref={track}
      id={id}
      className="scene-track ed-scene"
      data-static={isStatic ? '' : undefined}
      style={{ height: isStatic ? 'auto' : TRACK_HEIGHT }}
    >
      <div ref={stage} className="scene-stage">
        <article className="ed-spread">
          <p className="ed-kicker">05 — Craft</p>

          <h2 className="ed-headline">
            <span className="ed-headline-line">Nothing here is</span>
            <span className="ed-headline-line">an accident.</span>
          </h2>

          <p className="ed-standfirst">
            A short note on the decisions you’re not meant to notice.
          </p>

          <div className="ed-body">
            {/* Drop cap is ::first-letter, not a wrapper span — the word stays
                one intact text node for screen readers and text selection. */}
            <p className="ed-lead">
              Engineering is the work of making a thousand small choices and
              hiding every one of them. The model that fits in memory because of
              what was left out of it. The request path with nothing clever in
              it. The number picked once, deliberately, so everything after it
              can be relied on. Done well, none of it announces itself — the
              thing simply runs, on hardware nobody had to buy.
            </p>
            <p>
              That invisibility is the craft. Anyone can add a layer, a
              dependency, another model; the harder discipline is taking them
              away until what is left is small enough to trust. The restraint
              you cannot see is the part that took the longest.
            </p>
          </div>

          <div className="ed-quote-block">
            <span className="ed-quote-rule" aria-hidden="true" />
            <blockquote className="ed-quote">
              <p>“Anyone can add. Engineering is knowing what to remove.”</p>
            </blockquote>
          </div>

          <span className="ed-rule" aria-hidden="true" />

          <div className="ed-colophon">
            <p className="ed-closer">
              <span className="ed-closer-name">Santosh</span> is a machine
              learning engineer working where models meet systems — building
              things that look inevitable and feel effortless, which is to say,
              things that were neither.
            </p>
            {/* The role string here is the FIFTH place the positioning appears.
                The four documented ones — hero rail, hero cover line, this
                scene's closer, closing rail — were all updated when the
                positioning changed and this one was missed, so it read
                "Frontend Designer" on the live site directly beneath a closer
                calling him a machine learning engineer. Any future change to
                the positioning has to touch all five. */}
            <p className="ed-meta">
              Machine learning engineer · Chennai, India · 2026 · Notes on the
              work
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
