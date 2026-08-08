import type { ComponentType } from 'react'

/**
 * Scene contract — every scene in src/scenes must:
 *
 * 1. Be a default-exported component of SceneProps, lazy-loaded via
 *    registry.ts (its own chunk). Root element: <section class="scene-track">
 *    whose CSS height equals its registry `height`; the inner .scene-stage
 *    (100svh) is what gets pinned, with pinSpacing: false — the track owns
 *    the scroll space, so document height never changes at trigger creation.
 * 2. Create ALL animation inside useGSAP({ scope, dependencies: [isStatic],
 *    revertOnUpdate: true }) from src/lib/gsap.ts, so revert kills tweens,
 *    ScrollTriggers and pin spacers on unmount and on live setting flips.
 *    Event handlers created later must be wrapped in contextSafe.
 * 3. Author CSS at the settled state and animate `from` offsets. When
 *    usePrefersReducedMotion() or SCENE_MOBILE_QUERY matches, create
 *    NOTHING: set data-static on the root, collapse the track to auto
 *    height, and the static render must stay fully interactive.
 * 4. Clean up everything else symmetrically (listeners, observers, timers).
 *    Future WebGL scenes: dispose geometries/materials/textures/render
 *    targets/renderer on unmount (R3F JSX-declared objects auto-dispose;
 *    imperatively created ones don't).
 * 5. Never touch globals: no Lenis instances, no gsap.ticker callbacks that
 *    outlive the scene, no ScrollTrigger.killAll(). SmoothScroll owns the
 *    loop. Internal scrollable areas need data-lenis-prevent.
 */
export type SceneProps = {
  /** DOM id of the scene's root <section>, for anchors and debugging. */
  id: string
}

type SceneEntryBase = {
  id: string
  /** Scroll length in animated mode; MUST equal the scene's .scene-track height. */
  height: string
}

/**
 * Scenes are lazy by default. The one exception is an above-the-fold scene
 * (the hero): deferring it would paint an empty reserved box on the site's
 * first frame, so it is statically imported into the shell instead — and it
 * needs no height reservation, because there is no late mount to absorb.
 */
export type SceneEntry =
  | (SceneEntryBase & {
      eager?: false
      /** Module-scope import thunk — each loader becomes its own Vite chunk. */
      loader: () => Promise<{ default: ComponentType<SceneProps> }>
    })
  | (SceneEntryBase & {
      eager: true
      Component: ComponentType<SceneProps>
    })

/** Below this width scenes render static (low-fidelity mobile tier). */
export const SCENE_MOBILE_QUERY = '(max-width: 767px)'
