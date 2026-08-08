import { gsap } from './gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

// Pointer-physics plugins live here, NOT in lib/gsap.ts: only scene chunks
// import this module, so Draggable + InertiaPlugin stay lazy with the scene
// that needs them and out of the shell/first paint.
gsap.registerPlugin(Draggable, InertiaPlugin)

export { Draggable, InertiaPlugin }
