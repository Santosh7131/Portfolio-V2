import HeroScene from './hero/HeroScene'
import type { SceneEntry } from './types'

/**
 * Scene manifest and scroll order. Lives in the shell chunk — lazy entries
 * contribute only a dynamic-import thunk, and `height` is the scene's scroll
 * length, which must equal the scene's own .scene-track height (types.ts).
 *
 * The hero is the deliberate exception: it is statically imported and marked
 * eager so the opening frame is the cover rather than a reserved blank box.
 */
export const scenes: SceneEntry[] = [
  {
    id: 'hero',
    eager: true,
    Component: HeroScene,
    height: '170svh',
  },
  {
    id: 'profile',
    loader: () => import('./profile/ProfileScene'),
    height: '220svh',
  },
  {
    // Directly after profile: who he is, then what he built. The showpiece
    // scenes (systems, motion) follow as craft evidence rather than preamble.
    id: 'work',
    loader: () => import('./work/WorkScene'),
    height: '280svh',
  },
  {
    id: 'systems',
    loader: () => import('./systems/SystemsScene'),
    height: '240svh',
  },
  {
    id: 'motion',
    loader: () => import('./motion/MotionScene'),
    height: '340svh',
  },
  {
    id: 'editorial',
    loader: () => import('./editorial/EditorialScene'),
    height: '260svh',
  },
  {
    // Last, and unpinned: exactly one viewport, so the document ends flush
    // with the scene instead of on leftover track (see ClosingScene).
    id: 'closing',
    loader: () => import('./closing/ClosingScene'),
    height: '100svh',
  },
]
