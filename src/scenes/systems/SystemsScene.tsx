import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import {
  cssVars,
  DEFAULT_TOKENS,
  hueName,
  serializeTokensCss,
  tokenLines,
  UNIT_PX,
  type Density,
  type Elevation,
  type Tokens,
} from './tokens'
import Specimens from './specimens'
import './systems.css'

/** Scroll length in animated mode — MUST equal this scene's registry height. */
const TRACK_HEIGHT = '240svh'

type RangeControlProps = {
  label: string
  min: number
  max: number
  value: number
  display: string
  valueText: string
  onChange: (value: number) => void
}

function RangeControl({
  label,
  min,
  max,
  value,
  display,
  valueText,
  onChange,
}: RangeControlProps) {
  const fill = `${((value - min) / (max - min)) * 100}%`
  return (
    <label className="ds-control">
      <span className="ds-control-row">
        <span className="ds-control-label">{label}</span>
        <span className="ds-control-value">{display}</span>
      </span>
      <input
        className="ds-range"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        style={cssVars({ '--ds-fill': fill })}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}

type SegmentedControlProps<T extends string> = {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="ds-control">
      <span className="ds-control-row">
        <span className="ds-control-label">{label}</span>
      </span>
      <div className="ds-segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <label key={option.value} className="ds-segment">
            <input
              type="radio"
              className="ds-visually-hidden"
              name={`ds-${label.toLowerCase()}`}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const DENSITY_OPTIONS: ReadonlyArray<{ value: Density; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'standard', label: 'Standard' },
  { value: 'relaxed', label: 'Relaxed' },
]

const ELEVATION_OPTIONS: ReadonlyArray<{ value: Elevation; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'soft', label: 'Soft' },
  { value: 'lifted', label: 'Lifted' },
]

function CodePanel({ tokens }: { tokens: Tokens }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serializeTokensCss(tokens))
      setCopied(true)
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard unavailable (permissions/insecure context) — button stays "Copy".
    }
  }

  return (
    <div className="ds-code">
      <div className="ds-code-head">
        <span className="ds-code-filename">tokens.css</span>
        <button type="button" className="ds-copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <span className="ds-visually-hidden" aria-live="polite">
        {copied ? 'tokens.css copied to clipboard' : ''}
      </span>
      {/* Horizontal pans must reach this scrollable natively; vertical wheel
          over it still smooth-scrolls the page (scene contract, types.ts §5). */}
      <pre
        className="ds-code-body"
        role="region"
        aria-label="Generated tokens.css"
        tabIndex={0}
        data-lenis-prevent-horizontal
      >
        <code>
          <span className="ds-code-line">{':root {'}</span>
          {tokenLines(tokens).map((line) => (
            <span key={line.prop} className="ds-code-line">
              {'  '}
              {`${line.prop}:`.padEnd(16)}{' '}
              {/* key={value}: remounting the span restarts the pulse animation */}
              <span key={line.value} className="ds-code-value">
                {line.value}
              </span>
              ;
            </span>
          ))}
          <span className="ds-code-line">
            {'}'}
            <span className="ds-caret" aria-hidden="true">
              ▍
            </span>
          </span>
        </code>
      </pre>
    </div>
  )
}

export default function SystemsScene({ id }: SceneProps) {
  const [tokens, setTokens] = useState(DEFAULT_TOKENS)
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    () => {
      // Static contract: create NOTHING — the markup below is the settled
      // composition, and it stays fully interactive without a timeline.
      if (isStatic) return

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: track.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true, // Lenis provides the smoothing — don't double-smooth
          pin: stage.current,
          pinSpacing: false, // the track owns the scroll space
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      tl.from('.ds-kicker', { y: 24, autoAlpha: 0, duration: 0.1 }, 0)
        .from('.ds-heading', { y: 40, autoAlpha: 0, duration: 0.12 }, 0.04)
        .from('.ds-support', { y: 16, autoAlpha: 0, duration: 0.08 }, 0.12)
        .from(
          '.ds-cell',
          { y: 32, scale: 0.96, autoAlpha: 0, duration: 0.12, stagger: 0.06 },
          0.15,
        )
        .from(
          '.ds-control',
          { x: -24, autoAlpha: 0, duration: 0.1, stagger: 0.05 },
          0.35,
        )
        .from('.ds-code', { y: 24, autoAlpha: 0, duration: 0.07 }, 0.55)
        .from(
          '.ds-code-line',
          { x: -8, autoAlpha: 0, duration: 0.05, stagger: 0.016 },
          0.6,
        )
        .from('.ds-caret', { autoAlpha: 0, duration: 0.02 }, 0.78)
        // Held interactive beat: the scene sits pinned and settled for the
        // trailing stretch of scroll before it releases.
        .to({}, { duration: 0.22 }, 0.78)
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  const rootStyle: CSSProperties = {
    ...cssVars({
      '--ds-hue': String(tokens.hue),
      '--ds-radius': `${tokens.radius}px`,
      '--ds-unit': `${UNIT_PX[tokens.density]}px`,
    }),
    height: isStatic ? 'auto' : TRACK_HEIGHT,
  }

  return (
    <section
      ref={track}
      id={id}
      className="scene-track ds-scene"
      data-elev={tokens.elevation}
      data-static={isStatic ? '' : undefined}
      style={rootStyle}
    >
      <div ref={stage} className="scene-stage">
        <div className="ds-frame">
          <header className="ds-header">
            <p className="ds-kicker">03 — Systems</p>
            <h2 className="ds-heading">Four tokens. The rest follows.</h2>
            <p className="ds-support">
              Everything below reads from the same four variables. Nothing is
              styled twice.
            </p>
          </header>
          <div className="ds-columns">
            <div className="ds-controls">
              <RangeControl
                label="Hue"
                min={0}
                max={360}
                value={tokens.hue}
                display={`${tokens.hue}°`}
                valueText={`${tokens.hue}° — ${hueName(tokens.hue)}`}
                onChange={(hue) => setTokens((t) => ({ ...t, hue }))}
              />
              <RangeControl
                label="Radius"
                min={0}
                max={20}
                value={tokens.radius}
                display={`${tokens.radius}px`}
                valueText={`${tokens.radius} pixels`}
                onChange={(radius) => setTokens((t) => ({ ...t, radius }))}
              />
              <SegmentedControl
                label="Density"
                options={DENSITY_OPTIONS}
                value={tokens.density}
                onChange={(density) => setTokens((t) => ({ ...t, density }))}
              />
              <SegmentedControl
                label="Elevation"
                options={ELEVATION_OPTIONS}
                value={tokens.elevation}
                onChange={(elevation) => setTokens((t) => ({ ...t, elevation }))}
              />
            </div>
            <div className="ds-specimens">
              <Specimens />
            </div>
            <CodePanel tokens={tokens} />
          </div>
        </div>
      </div>
    </section>
  )
}
