import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { useMediaQuery } from '../lib/useMediaQuery'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { SCENE_MOBILE_QUERY, type SceneEntry, type SceneProps } from '../scenes/types'

type LazySceneProps = SceneEntry & {
  /** Reserved min-height while the scene renders static (reduced motion / mobile). */
  staticHeight?: string
  /** How early to fetch the chunk; default two viewports out. */
  rootMargin?: string
  placeholder?: ReactNode
}

type DeferredSceneProps = LazySceneProps & {
  loader: () => Promise<{ default: ComponentType<SceneProps> }>
}

/**
 * Rendered as a later sibling of the scene inside Suspense: both commit
 * together and effects run in tree order, so this refresh is guaranteed to
 * run after the scene's own trigger-creating layout effects.
 */
function RefreshOnMount() {
  useEffect(() => {
    ScrollTrigger.refresh()
  }, [])
  return null
}

/**
 * Mounts a scene from the registry. Eager entries (the hero) render straight
 * away from the shell chunk so the first frame is never blank; every other
 * scene waits for an IntersectionObserver, then code-splits via React.lazy
 * while the host reserves its full height so document height never jumps.
 */
export default function LazyScene(props: LazySceneProps) {
  if (props.eager) return <props.Component id={props.id} />
  return <DeferredScene {...props} />
}

function DeferredScene({
  id,
  loader,
  height,
  staticHeight = '100svh',
  rootMargin = '200% 0px',
  placeholder = null,
}: DeferredSceneProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery(SCENE_MOBILE_QUERY)
  const hostRef = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const Scene = useMemo(() => lazy(loader), [loader]) // import() caches; remount ≠ refetch

  useEffect(() => {
    if (armed) return
    const host = hostRef.current
    if (!host) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setArmed(true)
      },
      { rootMargin },
    )
    io.observe(host)
    return () => io.disconnect()
  }, [armed, rootMargin])

  const isStatic = prefersReducedMotion || isMobile
  return (
    <div
      ref={hostRef}
      className="scene-host"
      style={{ minHeight: isStatic ? staticHeight : height }}
    >
      {armed && (
        <Suspense fallback={placeholder}>
          <Scene id={id} />
          <RefreshOnMount />
        </Suspense>
      )}
    </div>
  )
}
