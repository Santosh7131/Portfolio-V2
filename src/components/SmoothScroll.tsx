import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'

/**
 * Owns the global scroll loop: gsap.ticker is the single rAF loop driving
 * Lenis, and Lenis's scroll events drive ScrollTrigger.update() — so GSAP and
 * Lenis never fight over scroll position.
 * Native scrolling is left untouched when the user prefers reduced motion,
 * including when that OS setting changes while the app is open.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  // Mirror the effective preference onto the document so CSS can honour it.
  // The global @media (prefers-reduced-motion) block only ever sees the OS
  // setting; without this attribute, switching motion off with the on-page
  // toggle would stop JS animation but leave every CSS transition running.
  useEffect(() => {
    const root = document.documentElement
    if (prefersReducedMotion) root.dataset.motion = 'reduced'
    else delete root.dataset.motion
    return () => {
      delete root.dataset.motion
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) {
      ScrollTrigger.refresh()
      return
    }

    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)

    // Runs after child (scene) effects: on a live reduced-motion flip the
    // scenes have already rebuilt or reverted their triggers by now.
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [prefersReducedMotion])

  return <>{children}</>
}
