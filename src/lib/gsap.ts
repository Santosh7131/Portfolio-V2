import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Lenis owns scroll smoothing; GSAP lag compensation would jump the scroll
// position exactly when a lazy scene chunk parses and janks the main thread.
gsap.ticker.lagSmoothing(0)

// svh-based layout is stable across mobile URL-bar show/hide; a full refresh
// on those resizes would make pinned scenes jump.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, useGSAP }
