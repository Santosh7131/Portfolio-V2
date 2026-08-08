// Site font setup — self-hosted variable faces, registered globally (scenes
// reference them via the --font-* custom properties in global.css).
//
// Fraunces ships every axis in `full.css` (opsz 9–144, wght 100–900, SOFT,
// WONK); the display type uses the optical-size axis. Newsreader is a
// reading face, so the weight-axis cut is all it needs. Fontsource sets
// font-display: swap and per-subset unicode-range, so only the Latin cut of
// each family is actually downloaded.
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/newsreader/wght.css'
// The real italic, not a synthesised oblique: Newsreader's italic is a
// separate design (single-storey a, cursive g), and the standfirst is set in
// it. Without this the browser mechanically slants the upright face.
import '@fontsource-variable/newsreader/wght-italic.css'
import frauncesLatin from '@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2?url'

// The display face is the first thing a reader sees, but @font-face fetches
// are lazy — the browser won't start one until it lays out text that needs it.
// Preloading hoists that fetch to the top of the waterfall.
const preload = document.createElement('link')
preload.rel = 'preload'
preload.as = 'font'
preload.type = 'font/woff2'
preload.crossOrigin = 'anonymous'
preload.href = frauncesLatin
document.head.appendChild(preload)
