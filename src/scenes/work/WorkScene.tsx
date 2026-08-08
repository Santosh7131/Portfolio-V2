import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import './work.css'

/** MUST equal this scene's registry height. */
const TRACK_HEIGHT = '280svh'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIDENTIALITY AND ACCURACY BOUNDARY — read before editing this file.
 *
 * The TalbotIQ engine is a real company's unreleased internal system. What may
 * appear here is Santosh's own engineering and his own measured results.
 *
 * NEVER publish, in any paraphrase:
 *   · the internal request-flow architecture, or their database/service layout
 *   · ANY security finding or vulnerability — no exceptions
 *   · the cost model or business rationale (hosting cost, per-request price,
 *     break-even volume, cost multiples)
 *   · which of their products the engine serves, or internal task identifiers
 *   · the third-party cloud model vendor they route to
 *
 * ACCURACY (dossier §9): the system is BUILT AND VALIDATED, NOT DEPLOYED.
 * Never imply production use, live traffic, or real users. Do not cite
 * structural evaluation scores — the harness's enum check was a containment
 * test, which inflated at least one of them. Do not present the retraining
 * loop as working: its training step has never executed. Prefer the phrasings
 * pre-vetted in dossier §10, which is where the copy below comes from.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FIGURES = [
  { value: '32', label: 'models fine-tuned, zero training failures' },
  { value: '~7.7 GB', label: 'total in memory, all thirty-two' },
  { value: '2.2–5.2×', label: 'throughput after a threading fix' },
]

// hrefs come from the résumé's own link annotations — the same destinations
// that PDF points at, not new claims about where these live.
const SECONDARY = [
  {
    name: 'XtractIQ',
    href: 'https://xtract-iq-frontend.onrender.com',
    line: 'Document data extractor. React + TypeScript with an OCR and LLM pipeline; fifteen scanned forms in ten seconds; schema-free extraction into PostgreSQL.',
  },
  {
    name: 'AURA',
    href: 'https://github.com/Santosh7131/AURA-Preprocessor',
    // The Wells Fargo Ideathon placing is deliberately NOT mentioned. Santosh's
    // standing decision (vault: decision-log, 2026-08-07) is that awards stay off
    // profiles and write-ups — they remain true and stay on the résumé, but they
    // are not selling points. Same for the SRM IoT Expo placing.
    line: 'AI-powered ML data-preprocessing platform. FastAPI + React TypeScript, with fifteen preprocessing modules on pandas and scikit-learn.',
  },
]

export default function WorkScene({ id }: SceneProps) {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    () => {
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

      tl.from('.wk-kicker, .wk-eyebrow', { y: 12, autoAlpha: 0, duration: 0.08, stagger: 0.04 }, 0)
        .from('.wk-heading-line', { y: 32, autoAlpha: 0, duration: 0.12, stagger: 0.05 }, 0.05)
        .from('.wk-standfirst', { y: 16, autoAlpha: 0, duration: 0.1 }, 0.18)
        .from('.wk-figure', { y: 18, autoAlpha: 0, duration: 0.1, stagger: 0.06 }, 0.26)
        .from('.wk-note, .wk-status', { y: 14, autoAlpha: 0, duration: 0.1, stagger: 0.05 }, 0.4)
        .from('.wk-rule', { scaleX: 0, duration: 0.12 }, 0.5)
        .from('.wk-second', { autoAlpha: 0, duration: 0.1, stagger: 0.06 }, 0.55)
        // Held reading beat — this scene carries the most text on the site.
        .to({}, { duration: 0.32 }, 0.68)
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  return (
    <section
      ref={track}
      id={id}
      className="scene-track wk-scene"
      data-static={isStatic ? '' : undefined}
      style={{ height: isStatic ? 'auto' : TRACK_HEIGHT }}
    >
      <div ref={stage} className="scene-stage">
        <article className="wk-spread">
          <p className="wk-kicker">02 — Work</p>
          <p className="wk-eyebrow">TalbotIQ · Built &amp; validated</p>

          <h2 className="wk-heading">
            <span className="wk-heading-line">Thirty-two models,</span>
            <span className="wk-heading-line">seven gigabytes, no GPU.</span>
          </h2>

          <p className="wk-standfirst">
            A self-hosted AI engine: 32 task-specific models fine-tuned with
            QLoRA on Qwen3-4B, quantized to 4-bit, and served from a single
            in-memory model through per-request adapter swapping — on ordinary
            CPUs.
          </p>

          <dl className="wk-figures">
            {FIGURES.map((f) => (
              <div key={f.value} className="wk-figure">
                <dt className="wk-figure-value">{f.value}</dt>
                <dd className="wk-figure-label">{f.label}</dd>
              </div>
            ))}
          </dl>

          <div className="wk-notes">
            <p className="wk-note">
              An OpenAI-compatible API layer carries the task identifier in the
              request&rsquo;s model field, so a consuming product adopts the
              engine by changing three values — base URL, key, and model.
              Verified by driving the endpoint with the official OpenAI SDK
              against unmodified client code.
            </p>
            <p className="wk-note">
              A held-out generalisation study with an in-distribution control
              separated real capability from training-template matching — and
              found one adapter that false-refused 8 of 12 of its own training
              prompts.
            </p>
          </div>

          <p className="wk-status">
            Built, integrated and validated end to end. Not yet deployed to
            production.
          </p>

          <span className="wk-rule" aria-hidden="true" />

          <ul className="wk-seconds">
            {SECONDARY.map((s) => (
              <li key={s.name} className="wk-second">
                <h3 className="wk-second-name">
                  <a
                    className="wk-second-link"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.name}
                    <span className="wk-second-mark" aria-hidden="true">
                      ↗
                    </span>
                    {/* Announced, not shown — as in the closing scene. */}
                    <span className="wk-sr">(opens in a new tab)</span>
                  </a>
                </h3>
                <p className="wk-second-line">{s.line}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
