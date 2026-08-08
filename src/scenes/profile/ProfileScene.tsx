import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import './profile.css'

/** MUST equal this scene's registry height. */
const TRACK_HEIGHT = '220svh'

/**
 * Every factual claim on this page is traceable to the résumé, the LinkedIn
 * export, or the project dossier. Nothing is inferred. In particular the
 * TalbotIQ entry states no job title: the dossier never gives one, and a title
 * is a claim about the employer's designation, not a copy choice. It says
 * "sole engineer", which the dossier does document (§3).
 */
const ROLES = [
  {
    org: 'TalbotIQ',
    role: 'Internship',
    meta: null,
    line: 'Sole engineer on a self-hosted AI engine: 32 fine-tuned models, CPU-only inference.',
  },
  {
    org: 'Integra',
    role: 'Full Stack Developer Intern',
    meta: 'Jun–Jul 2025 · Chennai',
    line: 'MERN automation platform; cut manual data-entry time by 75%.',
  },
]

export default function ProfileScene({ id }: SceneProps) {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    () => {
      // Static contract: create nothing. The markup is the finished spread.
      if (isStatic) return

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

      tl.from('.pr-kicker', { y: 14, autoAlpha: 0, duration: 0.08 }, 0)
        .from('.pr-heading', { y: 34, autoAlpha: 0, duration: 0.12 }, 0.04)
        .from('.pr-bio', { y: 16, autoAlpha: 0, duration: 0.1 }, 0.16)
        .from('.pr-role', { y: 18, autoAlpha: 0, duration: 0.11, stagger: 0.07 }, 0.24)
        .from('.pr-rule', { scaleX: 0, duration: 0.12 }, 0.42)
        .from('.pr-rail', { autoAlpha: 0, duration: 0.1, stagger: 0.05 }, 0.48)
        // Held reading beat.
        .to({}, { duration: 0.4 }, 0.6)
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  return (
    <section
      ref={track}
      id={id}
      className="scene-track pr-scene"
      data-static={isStatic ? '' : undefined}
      style={{ height: isStatic ? 'auto' : TRACK_HEIGHT }}
    >
      <div ref={stage} className="scene-stage">
        <article className="pr-spread">
          <p className="pr-kicker">01 — Profile</p>

          <h2 className="pr-heading">Machine learning engineer.</h2>

          <p className="pr-bio">
            Currently building a self-hosted AI engine at TalbotIQ — thirty-two
            fine-tuned models served from one machine, CPU-only. Before that, a
            full-stack internship at Integra automating document data
            extraction. Computer Science undergraduate at SRM, Chennai.
          </p>

          <ol className="pr-roles">
            {ROLES.map((r) => (
              <li key={r.org} className="pr-role">
                <h3 className="pr-role-org">{r.org}</h3>
                <p className="pr-role-title">
                  {r.role}
                  {r.meta && <span className="pr-role-meta"> · {r.meta}</span>}
                </p>
                <p className="pr-role-line">{r.line}</p>
              </li>
            ))}
          </ol>

          <span className="pr-rule" aria-hidden="true" />

          <div className="pr-rails">
            <p className="pr-rail">
              <span className="pr-rail-label">Education</span>
              SRM Institute of Science and Technology · B.Tech Computer Science
              and Engineering · 2023–2027 · GPA 8.8
            </p>
            <p className="pr-rail">
              <span className="pr-rail-label">Certifications</span>
              Red Hat Certified Specialist in Containers (Feb 2026) ·
              freeCodeCamp Responsive Web Design (300 hours)
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
