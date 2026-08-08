import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import ArcadeDoor from './arcade/ArcadeDoor'
import LazyScene from './components/LazyScene'
import MotionToggle from './components/MotionToggle'
import SmoothScroll from './components/SmoothScroll'
import { scenes } from './scenes/registry'

// Own chunk: the arcade is a hidden extra and must cost the main journey
// nothing. Nothing here is fetched until someone navigates to /arcade.
const ArcadeRoute = lazy(() => import('./arcade/ArcadeRoute'))

function Home() {
  return (
    <main>
      {/* Scroll order comes from the registry: hero (eager, carries the page's
          only h1) → scenes → closing. Nothing follows the last scene. */}
      {scenes.map((scene) => (
        <LazyScene key={scene.id} {...scene} />
      ))}
    </main>
  )
}

export default function App() {
  const isArcade = useLocation().pathname === '/arcade'

  return (
    <SmoothScroll>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/arcade"
          element={
            <Suspense fallback={null}>
              <ArcadeRoute />
            </Suspense>
          }
        />
      </Routes>
      <ArcadeDoor />
      {/* Shell-level, not per-scene: reachable at any scroll position. The
          arcade is full-bleed and has its own chrome, so it opts out. */}
      {!isArcade && <MotionToggle />}
    </SmoothScroll>
  )
}
