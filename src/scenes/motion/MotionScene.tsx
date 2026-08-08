import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { Draggable, InertiaPlugin } from '../../lib/gsapDraggable'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneProps } from '../types'
import { CHIPS, PHYSICS } from './chips'
import './motion.css'

/** Scroll length in animated mode — MUST equal this scene's registry height. */
const TRACK_HEIGHT = '340svh'

/**
 * Per-chip physics state. One gsap.ticker callback integrates every active
 * chip: positional flights (velocity + exponential friction + damped wall
 * reflection) and a slightly underdamped rotation spring (tilt follows
 * horizontal velocity, settles level with a small overshoot). No tweens own
 * rotation while a chip is live, so there is nothing to fight or overwrite.
 */
type ChipState = {
  el: HTMLElement
  homeRot: number
  dragging: boolean
  flying: boolean
  settling: boolean
  /** User has grabbed this chip → physics/auto-return own it, not the
   *  entrance timeline. Untouched chips stay timeline-owned. */
  disturbed: boolean
  vx: number
  vy: number
  rot: number
  rotV: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  setX: (value: number) => void
  setY: (value: number) => void
  setRot: (value: number) => void
}

export default function MotionScene({ id }: SceneProps) {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const isStatic = prefersReducedMotion || isMobile

  useGSAP(
    (_, contextSafe) => {
      const stageEl = stage.current
      const safe = contextSafe
      if (!stageEl || !safe) return
      const chips = gsap.utils.toArray<HTMLElement>('.mo-chip', stageEl)

      if (isStatic) {
        // A prior animated mount then a live flip to static (resize across
        // 768px, or OS reduced-motion toggled on) leaves GSAP's
        // xPercent/rotation transform inline on each chip; clear it so the
        // static flow layout isn't shifted up-left and tilted. No-op on a
        // first static mount.
        gsap.set(chips, { clearProps: 'transform' })

        // Static contract (deliberate): no entrance, no inertia, no bounce,
        // no spin, no auto-return. Chips stay grabbable with direct 1:1 drag
        // and remain wherever they're dropped.
        const draggables = chips.map(
          (chip) =>
            Draggable.create(chip, {
              type: 'x,y',
              bounds: stageEl,
              onPress: () => chip.classList.add('is-held'),
              onRelease: () => chip.classList.remove('is-held'),
            })[0],
        )
        return () => draggables.forEach((draggable) => draggable.kill())
      }

      // ----- animated tier -----
      gsap.set(chips, {
        xPercent: -50,
        yPercent: -50,
        rotation: (i: number) => CHIPS[i].rot,
      })

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: track.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          pin: stageEl,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      tl.from('.mo-kicker', { y: 24, autoAlpha: 0, duration: 0.08 }, 0)
        .from('.mo-heading', { y: 40, autoAlpha: 0, duration: 0.1 }, 0.03)
        .from('.mo-support', { y: 16, autoAlpha: 0, duration: 0.07 }, 0.1)
        .from(
          chips,
          {
            y: '+=60',
            autoAlpha: 0,
            rotation: (i: number) => CHIPS[i].rot + (i % 2 ? 7 : -7),
            duration: 0.14,
            stagger: 0.04,
          },
          0.15,
        )
        // Held play window: pinned and interactive for the rest of the track.
        .to({}, { duration: 0.55 }, 0.45)

      InertiaPlugin.track(chips, 'x,y')

      const states = new Map<HTMLElement, ChipState>(
        chips.map((chip, i) => [
          chip,
          {
            el: chip,
            homeRot: CHIPS[i].rot,
            dragging: false,
            flying: false,
            settling: false,
            disturbed: false,
            vx: 0,
            vy: 0,
            rot: CHIPS[i].rot,
            rotV: 0,
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0,
            setX: gsap.quickSetter(chip, 'x', 'px') as (v: number) => void,
            setY: gsap.quickSetter(chip, 'y', 'px') as (v: number) => void,
            setRot: gsap.quickSetter(chip, 'rotation', 'deg') as (v: number) => void,
          },
        ]),
      )

      let idleTimer: number | undefined
      const clearIdle = () => window.clearTimeout(idleTimer)

      const returnHome = safe(() => {
        // Only tidy chips the user actually disturbed, and never a chip
        // currently held (a second finger releasing chip A must not yank
        // held chip B home). Untouched chips stay owned by the entrance
        // timeline / their resting spot.
        const homing = chips.filter((chip) => {
          const state = states.get(chip)!
          return state.disturbed && !state.dragging
        })
        if (!homing.length) return
        homing.forEach((chip) => {
          const state = states.get(chip)!
          state.flying = false
          state.settling = true // rotation spring carries each chip level
          chip.classList.add('is-live') // stay above others through the glide
        })
        gsap.to(homing, {
          x: 0,
          y: 0,
          duration: PHYSICS.returnDuration,
          ease: 'power3.inOut',
          stagger: PHYSICS.returnStagger,
          overwrite: 'auto',
          onComplete: () => {
            homing.forEach((chip) => {
              const state = states.get(chip)!
              if (!state.dragging && !state.flying) {
                state.disturbed = false
                chip.classList.remove('is-live')
              }
            })
          },
        })
      })

      const scheduleReturn = () => {
        clearIdle()
        idleTimer = window.setTimeout(returnHome, PHYSICS.idleReturnMs)
      }

      const measureBounds = (state: ChipState) => {
        const stageRect = stageEl.getBoundingClientRect()
        const chipRect = state.el.getBoundingClientRect()
        const x = gsap.getProperty(state.el, 'x') as number
        const y = gsap.getProperty(state.el, 'y') as number
        state.minX = x - (chipRect.left - stageRect.left)
        state.maxX = x + (stageRect.right - chipRect.right)
        state.minY = y - (chipRect.top - stageRect.top)
        state.maxY = y + (stageRect.bottom - chipRect.bottom)
      }

      // Throw velocity from the samples BEFORE Draggable's release-time bounds
      // clamp. edgeResistance lets a chip render past the soft edge; on release
      // Draggable snaps it back synchronously, and a plain getVelocity folds
      // that snap into the reading — so a chip dropped at the edge would dart
      // inward on its own. skipRecentTick (get's 2nd arg, absent from the .d.ts)
      // excludes that final sample.
      const releaseVelocity = (chip: HTMLElement, axis: 'x' | 'y') => {
        const tracker = InertiaPlugin.getByTarget(chip) as unknown as
          | { get(prop: string, skipRecentTick?: boolean): number }
          | undefined
        return tracker ? tracker.get(axis, true) : 0
      }

      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs / 1000, 0.05)
        const decay = Math.exp(-PHYSICS.friction * dt)
        states.forEach((state) => {
          if (!state.dragging && !state.flying && !state.settling) return

          // -- position: velocity + friction + damped wall reflection --
          if (state.flying) {
            let x = (gsap.getProperty(state.el, 'x') as number) + state.vx * dt
            let y = (gsap.getProperty(state.el, 'y') as number) + state.vy * dt
            if (x < state.minX) {
              x = state.minX
              state.vx = -state.vx * PHYSICS.wallDamping
            } else if (x > state.maxX) {
              x = state.maxX
              state.vx = -state.vx * PHYSICS.wallDamping
            }
            if (y < state.minY) {
              y = state.minY
              state.vy = -state.vy * PHYSICS.wallDamping
            } else if (y > state.maxY) {
              y = state.maxY
              state.vy = -state.vy * PHYSICS.wallDamping
            }
            state.vx *= decay
            state.vy *= decay
            state.setX(x)
            state.setY(y)
            if (Math.hypot(state.vx, state.vy) < PHYSICS.restSpeed) {
              state.flying = false
              state.settling = true
            }
          }

          // -- rotation: underdamped spring toward the velocity-based tilt --
          const vx = state.dragging
            ? InertiaPlugin.getVelocity(state.el, 'x') * 0.6
            : state.flying
              ? state.vx
              : 0
          const target =
            state.homeRot +
            gsap.utils.clamp(-PHYSICS.maxSpin, PHYSICS.maxSpin, vx * PHYSICS.spinFactor)
          const accel =
            PHYSICS.rotStiffness * (target - state.rot) - PHYSICS.rotDamping * state.rotV
          state.rotV += accel * dt
          state.rot += state.rotV * dt
          state.setRot(state.rot)

          if (
            state.settling &&
            Math.abs(state.rot - state.homeRot) < 0.1 &&
            Math.abs(state.rotV) < 0.1
          ) {
            state.settling = false
            state.setRot(state.homeRot)
            // Fully at rest — drop the z-elevation, unless a return glide is
            // still carrying this chip (returnHome's onComplete clears it then).
            if (!gsap.isTweening(state.el)) state.el.classList.remove('is-live')
          }
        })
      }
      gsap.ticker.add(tick)

      const draggables = chips.map((chip) => {
        const state = states.get(chip)!
        return Draggable.create(chip, {
          type: 'x,y',
          bounds: stageEl,
          edgeResistance: 0.85,
          onPress: () => {
            // Take ownership: stop any return/entrance tween on this chip so
            // the hand, not a timeline, decides where it goes.
            gsap.killTweensOf(chip, 'x,y,rotation')
            state.flying = false
            state.dragging = true
            state.disturbed = true
            state.rot = gsap.getProperty(chip, 'rotation') as number
            chip.classList.add('is-held', 'is-live')
            clearIdle()
          },
          onRelease: () => {
            state.dragging = false
            chip.classList.remove('is-held') // is-live stays until it rests
            const vx = releaseVelocity(chip, 'x')
            const vy = releaseVelocity(chip, 'y')
            const speed = Math.hypot(vx, vy)
            if (speed > PHYSICS.restSpeed) {
              const cap = speed > PHYSICS.maxSpeed ? PHYSICS.maxSpeed / speed : 1
              state.vx = vx * cap
              state.vy = vy * cap
              measureBounds(state)
              state.flying = true
            } else {
              state.settling = true // dropped gently: just settle level
            }
            scheduleReturn()
          },
        })[0]
      })

      return () => {
        gsap.ticker.remove(tick)
        clearIdle()
        draggables.forEach((draggable) => draggable.kill())
        chips.forEach((chip) => InertiaPlugin.untrack(chip))
        states.clear()
      }
    },
    { scope: track, dependencies: [isStatic], revertOnUpdate: true },
  )

  return (
    <section
      ref={track}
      id={id}
      className="scene-track mo-scene"
      data-static={isStatic ? '' : undefined}
      style={{ height: isStatic ? 'auto' : TRACK_HEIGHT }}
    >
      <div ref={stage} className="scene-stage">
        <header className="mo-header">
          <p className="mo-kicker">04 — Motion</p>
          <h2 className="mo-heading">Everything here has weight.</h2>
          <p className="mo-support">Go on — pick one up.</p>
        </header>
        <div className="mo-field">
          {CHIPS.map((chip) => (
            <div
              key={chip.word}
              className="mo-chip"
              style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
            >
              <span className="mo-chip-face">{chip.word}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
