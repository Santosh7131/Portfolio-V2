# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Shared brain:** this project is connected. The authoritative instructions live in the
> `<!-- brain:start -->` block at the bottom of this file, which
> `node ~/.claude/connect-brain.mjs` owns and rewrites — don't hand-edit it. This
> project's vault note is `30-projects/personal-website.md`, flagged `public: false`
> because it references TalbotIQ work.

## Commands

- `npm run dev` — Vite dev server on port 5173. For Claude's Browser pane, use the `dev` config in `.claude/launch.json` instead of running it in Bash.
- `npm run build` — typecheck (`tsc -b`) then production build. Output is `dist/`.
- `npx tsc -b` — typecheck only.
- No lint or test tooling is configured yet.
- `python scripts/build-brand-assets.py` — regenerates `favicon.svg`, `apple-touch-icon.png` and `assets/og-cover.png` from the fonts in `node_modules` and the palette in `hero.css`. Re-run it if either changes; the assets are committed, so it is not part of `npm run build`.
**Deploy — Vercel.** Import the repo; Vercel detects Vite and needs no settings (build `npm run build`, output `dist/`).

- `vercel.json` supplies the SPA rewrite `/arcade` needs. Vercel checks the filesystem *before* rewrites, so hashed assets, the `.jsdos` bundle and the résumé PDF are still served as themselves — only unmatched paths fall through to the shell. Without it, `/arcade` 404s on a hard load or reload.
- `public/_redirects` is the Cloudflare Pages equivalent, kept so the site can deploy to either host. It is inert on Vercel.
- `index.html` carries a placeholder origin (`https://REPLACE-ME.vercel.app`) in four tags — canonical, `og:url`, `og:image`, `twitter:image`. Open Graph needs absolute URLs, so these must be swapped for the real origin or link previews ship with no image.
- **Never publish without `python scripts/verify-resume.py` exiting 0** — pushing to the public repo counts as publishing.

**OneDrive caveat:** this project lives in a OneDrive-synced folder and Vite's file watcher sometimes misses edits (HMR silently doesn't fire). A full browser reload always picks up changes; if it becomes chronic, add `server: { watch: { usePolling: true } }` to `vite.config.ts`.

## What this site is

A scroll-driven portfolio where scrolling scrubs an authored timeline of full-height "scenes" — cinematic, WebGL-accented, playful. The quality bar is set by activetheory.net, bruno-simon.com, and dustinbrett.com.

The site belongs to a frontend designer, and its #1 job is to be **live proof** of fancy, polished, technically proficient UI work — the site itself is the primary work sample. Every detail should read as the work of a top-tier 2026 designer: obsessive polish, considered motion, zero templated or default-looking choices. Copy is show-don't-tell — confident but understated; let the craft brag.

### The arcade (hidden extra — not a scene)

`src/arcade/` is a playable DOOM easter egg. It is deliberately **not** in the registry and never appears in the scroll journey. Three ways in: type `idkfa` anywhere, read the console hint, or go to `/arcade` directly.

- **WAD rule:** shareware `doom1.wad` or Freedoom **only — never a retail IWAD.** Currently the complete, unmodified id shareware package (v1.2) in `public/assets/doom-shareware.jsdos`, with id's original `LICENSE.DOC`/`VENDOR.DOC` inside the bundle. Free redistribution is permitted by clause 2 of that licence; `VENDOR.DOC` exempts electronic distribution from the vendor-licence requirement. Credit and disclaimer are rendered in the arcade footer.
- **js-dos is GPL-2.0** and ships no module entry. It is loaded from `v8.js-dos.com` at click time — never bundled, never vendored. Keep it that way: bundling it would pull GPL obligations onto the whole site, and it is what keeps the emulator out of the shell.
- Nothing (emulator, wasm, WAD) is fetched until an explicit click. The route is its own `React.lazy` chunk.
- The game is user-initiated content and is **exempt** from the motion toggle; only its surrounding chrome respects reduced motion.

### Scenes / work

Three showpiece scenes, each proving a different design muscle:

1. **Systems & craft** — an interactive mini design system / component playground.
2. **Interaction & motion** — one signature interaction built to perfection (the wow).
3. **Visual & type** — an editorial/typographic scene with striking hierarchy and type.

If 1–2 real projects genuinely look great, swap one showpiece for a live case study — but never a flat screenshot that breaks the cinematic feel.

**Build approach:** polished DOM/CSS/Canvas/GSAP with selective WebGL accents — NOT a heavy 3D-model pipeline. Quality over quantity: 3 flawless scenes beat 8 okay ones.

## Build rules

- Build scene by scene; each scene is its own lazy-loaded chunk (`React.lazy` + `Suspense`).
- Dispose all GPU resources (geometries, materials, textures) on scene unmount — no leaks.
- Wire Lenis's scroll into `ScrollTrigger.update()` so GSAP and Lenis don't fight over scroll position.
- Honor `prefers-reduced-motion` on every animation (see the reduced-motion invariant below), plus an on-page motion toggle (not yet built).
- Mobile gets an explicit low-fidelity tier — reduced pixel ratio, no post-processing, LOD or 2D/video fallbacks — not just a smaller viewport.

## Architecture

A single-page personal website: a scroll-driven magazine. Seven scenes, in registry order — `hero/` (cover, eager), `profile/` (who he is), `work/` (the TalbotIQ AI engine plus a secondary project tier), `systems/` (design-system playground), `motion/` ("Heft" — draggable physics chips), `editorial/` (art-directed type spread), `closing/` (back cover, unpinned). `@react-three/fiber` and `@react-three/drei` are installed but deliberately unused so far.

Work sits directly after profile: who he is, then what he built, with the two showpiece scenes following as craft evidence. The scene kickers are numbered in scroll order (`01 — Profile` … `05 — Craft`) and `work.css`'s header comment carries the same number, so **reordering the registry means renumbering all of them together**. The numbering in `systems.css`, `motion.css` and `editorial.css` headers is a *different* scheme — the showpiece triad from "Scenes / work" above — and does not track scroll position.

Positioning is **machine learning engineer** — the hero rail, hero cover line, editorial closer and closing rail all state it. If that ever changes, those four strings change together.

### Biographical content — accuracy rules

`profile/` and `work/` are the only scenes making factual claims about a person and an employer, so they are held to stricter rules than the rest of the site:

- Every claim traces to `Context/` (résumé, LinkedIn export) or the project dossier. Nothing inferred, nothing embellished. The TalbotIQ entry deliberately states **no job title** — the dossier gives none, and a title is a claim about the employer's records.
- The TalbotIQ system is **built and validated, not deployed.** Never imply production use, live traffic or real users. The status line in `work/` is load-bearing copy, not a disclaimer.
- Confidentiality: no internal architecture, **no security findings of any kind**, no cost model, no naming of their products or their cloud vendor. The full boundary is documented in the header comment of `WorkScene.tsx` — read it before editing that file.
- `node scripts/check-confidential.mjs` greps `src/` for forbidden literals. It is a **backstop, not a clearance** — a fixed word list cannot catch a paraphrase. Human judgement is the actual boundary.

**The published résumé is a redacted derivative, never the file in `Context/`.** `Context/Santosh_Resume_V5.pdf` carries a mobile number and a personal email; `public/assets/Santosh-Kumaar-Resume.pdf` (linked from `closing/`) has both deleted at the content-stream level.

- `python scripts/build-resume.py` regenerates it from the source PDF.
- `python scripts/verify-resume.py` is the gate. It checks the text layer, every object and decompressed stream, the raw bytes, the link annotations and the metadata. **Run it after any rebuild and never publish on a non-zero exit** — covering text with a white box leaves it fully extractable, which is the exact failure this guards.
- Both need `pymupdf`; `build-brand-assets.py` also needs `pillow` and `fonttools`+`brotli`.

- `src/main.tsx` mounts `<BrowserRouter>` (from `react-router` — v7 has no separate `react-router-dom` import) around `App`.
- `src/App.tsx` defines routes; the one page is hero `<Section>` → scenes from `src/scenes/registry.ts` → closing `<Section>`.
- `src/components/SmoothScroll.tsx` wraps the whole app and owns the global scroll loop: `gsap.ticker` drives Lenis (the single rAF loop) and `lenis.on('scroll', ScrollTrigger.update)` keeps GSAP in sync. Under reduced motion neither exists.
- `src/lib/gsap.ts` is the ONLY module allowed to import gsap core — it registers ScrollTrigger and sets global config (`lagSmoothing(0)`, `ignoreMobileResize`) exactly once. gsap core lives in the shell chunk deliberately; scene chunks share that one copy. Pointer-physics plugins (Draggable, InertiaPlugin) register in `src/lib/gsapDraggable.ts`, which must only be imported from scene chunks so they stay lazy and out of first paint.

### Scene pattern

Every scene follows the same shape (full contract in `src/scenes/types.ts`):

- Lives in `src/scenes/<name>/`, default-exports a component of `SceneProps`, and is registered in `src/scenes/registry.ts` (`{ id, loader, height }`) — each loader is its own lazy chunk. `registry.ts` also defines scroll order; `App.tsx` just maps it.
- **Eager exception:** an above-the-fold scene registers `{ eager: true, Component }` with a static import instead of a `loader`, so it ships in the shell and paints on the first frame. Only the hero should do this — deferring it would render an empty reserved box as the site's opening image. Eager entries get no height reservation (there is no late mount to absorb).
- **Unpinned exception:** the last scene (`closing`) is one viewport tall and is not pinned — it scrubs on approach instead. A pinned last scene would leave its track's remaining length as dead scroll after the pin releases; this way the document ends flush with the scene.
- Mounted via `<LazyScene>` (`src/components/LazyScene.tsx`): IntersectionObserver arms `React.lazy` ~2 viewports early, the host reserves the registry `height` so document height never jumps, and a sibling effect calls `ScrollTrigger.refresh()` after the scene's triggers exist.
- Root is `<section class="scene-track">` whose height equals its registry `height`; the inner `.scene-stage` (100svh) is pinned with `pinSpacing: false` and scrubbed with `scrub: true` (Lenis provides the smoothing — never `scrub: <number>`).
- All animation is created inside `useGSAP({ scope, dependencies: [isStatic], revertOnUpdate: true })`. CSS is authored at the settled state; GSAP animates `from` offsets.
- Static tier: when `usePrefersReducedMotion()` or `SCENE_MOBILE_QUERY` matches, the scene creates no animation, sets `data-static`, collapses its track to `auto`, and must remain fully interactive.

### Reduced-motion invariant

Honoring reduced motion is a hard requirement, enforced in four places that must stay in sync:

1. `usePrefersReducedMotion()` (`src/lib/usePrefersReducedMotion.ts`) is the **single source of truth**: OS setting OR the on-page toggle. An OS preference always wins — the toggle can remove motion, never force it back on. Backed by `useSyncExternalStore` (`src/lib/motionPreference.ts`, localStorage-persisted, cross-tab), so there is no provider to wire up.
2. `SmoothScroll` skips Lenis entirely (native scrolling) when it is on, and reacts live.
3. `src/styles/global.css` zeroes animation/transition durations *and delays* — for **both** `@media (prefers-reduced-motion: reduce)` (the OS) and `:root[data-motion='reduced']` (the toggle, mirrored onto `<html>` by `SmoothScroll`). The media query cannot see the toggle; if you add one rule set, add the other.
4. Every scene gates its `useGSAP` on the hook with `dependencies: [isStatic], revertOnUpdate: true`, so flipping it live tears down and rebuilds cleanly.

Any future GSAP or R3F animation must also be gated on the hook — CSS cannot reach JS-driven animation.

`MotionToggle` lives in the shell (`App.tsx`, fixed) and occupies the `--page-gutter` lane on desktop, which every scene insets its content by. A horizontal gutter is the only reservation that holds at every scroll position — if you shrink `--page-gutter` below ~72px, the toggle will start overlapping scene content.

### Version pinning

React 19 ⟷ @react-three/fiber v9 ⟷ drei v10 are a compatibility set; don't bump one major without the others. `three` and `@types/three` stay on matching minors. `vite` and `@vitejs/plugin-react` are released in lockstep — upgrade both to latest together, never one side alone.

### Type

`src/styles/fonts.ts` is the single font-registration site (imported from `main.tsx` before `global.css`): self-hosted variable faces via `@fontsource-variable`, exposed as `--font-display` (Fraunces — import `full.css` for the `opsz`/`WONK` axes) and `--font-body` (Newsreader) on `:root`. Import the matching `*-italic.css` for any face used in italic — the upright-only cut makes browsers synthesise a fake oblique. The display face is preloaded; Fontsource already sets `font-display: swap` and per-subset `unicode-range`.

### Conventions

- Headings: `Section` takes a `headingLevel` prop; exactly one `h1` per page (the first/hero section).
- Static assets go in `public/assets/`.

<!-- brain:start -->
## Shared brain: connected

This project reads **and writes** Santosh's shared brain — a folder of markdown notes
that every connected Claude session shares:

`C:\Users\santo\OneDrive\Documents\Obsidian Vault`

### Starting work here

Read `Brain.md`, then whichever notes it points to that touch what you're doing.
`00-identity/about-me.md` is who he is. `00-identity/how-to-work-with-me.md` is how he
wants you to work. Read `00-identity/memory-protocol.md` before writing anything — it's
the contract, and this block is only a summary of it.

### Write to the brain whenever something important happens

Don't wait to be asked. Do it as part of finishing the work, before reporting back.

| What happened | Where it goes |
|---|---|
| This project changed state — shipped, stalled, changed direction | `30-projects/<this-project>.md` (one note per project; copy `30-projects/_status-template.md` if it doesn't exist yet) |
| A decision was made, and the reasoning matters | `decision-log.md` |
| Learned something durable about Santosh or his preferences | `00-identity/about-me.md` or `how-to-work-with-me.md` |
| Hit an environment gotcha that will bite again | `40-reference/machine-and-toolchains.md` |
| This project became a tool other projects should reach for | `40-reference/capabilities.md` |

### Write for a reader who will never open this codebase

A vault note is read by a session working in a *different* project. It must stand on its
own: what this project is, why it exists, what state it's actually in, and any constraint
that affects other people's work — several paragraphs, not a one-liner. If a reader
couldn't describe the project to a stranger from your note alone, it isn't finished.

Keep file paths, function names, hyperparameters, tolerances and build gotchas **out** of
the vault — those live in this project's own `~/.claude/projects/<slug>/memory/`, which
loads automatically here. Point at it; never copy it.

### How to write

- **Correct facts in place — never append a contradiction.** Two notes disagreeing is
  worse than no note.
- Bump `updated`; bump `verified` only when you actually re-checked against reality.
- **No edit logs.** Don't keep a running list of your changes to a note — that's
  bookkeeping, and it grows forever. If a change needs explaining, explain it in the body,
  or put the reasoning in `decision-log.md`.
- Mark dead ends `status: superseded` instead of deleting them, so nobody retries them.
- Link related notes with `[[wikilinks]]`.

### Before trusting anything you read

Notes marked `volatility: volatile` — paths, versions, repo state, "current" status —
are **hints about where to look, not facts to assert.** Verify, then fix the note if it
has gone stale.

### Boundaries

- **Never** write secrets, tokens or API keys into the vault.
- `public: true` on a note means it may appear in something the world sees (his GitHub
  profile). Default is `false`; work material is always `false`.
- Detail only *this* project cares about belongs in its own
  `~/.claude/projects/<slug>/memory/` folder, which loads automatically. The vault is
  only for what other projects need to see.
<!-- brain:end -->
