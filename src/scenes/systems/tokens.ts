import type { CSSProperties } from 'react'

export type Density = 'compact' | 'standard' | 'relaxed'
export type Elevation = 'flat' | 'soft' | 'lifted'

export type Tokens = {
  /** oklch hue, 0–360 */
  hue: number
  /** base corner radius in px, 0–20; components scale it by fixed ratios */
  radius: number
  density: Density
  elevation: Elevation
}

export const DEFAULT_TOKENS: Tokens = {
  hue: 262,
  radius: 10,
  density: 'standard',
  elevation: 'soft',
}

/** Spacing unit per density — every padding/gap in the system is a multiple. */
export const UNIT_PX: Record<Density, number> = {
  compact: 3,
  standard: 4,
  relaxed: 5,
}

/** Surface lightness/chroma per elevation (mirrors systems.css [data-elev]). */
const SURFACE_LC: Record<Elevation, readonly [number, number]> = {
  flat: [0.19, 0.012],
  soft: [0.215, 0.014],
  lifted: [0.24, 0.016],
}

/* oklch hue 0 sits on the pink/magenta axis (sRGB red is ~hue 25), so the
 * pink band wraps through 0 rather than starting a red band there. */
const HUE_BUCKETS: ReadonlyArray<readonly [number, string]> = [
  [15, 'pink'],
  [35, 'red'],
  [75, 'orange'],
  [110, 'yellow'],
  [165, 'green'],
  [215, 'teal'],
  [275, 'blue'],
  [320, 'violet'],
  [360, 'pink'],
]

/** Coarse color name for slider aria-valuetext, e.g. "262° — blue". */
export function hueName(hue: number): string {
  const h = ((hue % 360) + 360) % 360
  const bucket = HUE_BUCKETS.find(([limit]) => h < limit)
  return bucket ? bucket[1] : 'red'
}

export type TokenLine = { prop: string; value: string }

/** Resolved (shippable) values — exactly what the code panel displays. */
export function tokenLines({ hue, radius, density, elevation }: Tokens): TokenLine[] {
  const [l, c] = SURFACE_LC[elevation]
  return [
    { prop: '--accent', value: `oklch(0.72 0.17 ${hue})` },
    { prop: '--accent-hover', value: `oklch(0.78 0.16 ${hue})` },
    { prop: '--accent-subtle', value: `oklch(0.72 0.17 ${hue} / 14%)` },
    { prop: '--focus-ring', value: `oklch(0.78 0.15 ${hue} / 90%)` },
    { prop: '--radius', value: `${radius}px` },
    { prop: '--radius-lg', value: `${Math.round(radius * 1.6)}px` },
    { prop: '--space-unit', value: `${UNIT_PX[density]}px` },
    { prop: '--surface', value: `oklch(${l} ${c} ${hue})` },
  ]
}

export function serializeTokensCss(tokens: Tokens): string {
  return [
    ':root {',
    ...tokenLines(tokens).map(
      (line) => `  ${`${line.prop}:`.padEnd(16)} ${line.value};`,
    ),
    '}',
  ].join('\n')
}

/** Typed escape hatch for CSS custom properties in React style objects. */
export function cssVars(vars: Record<`--${string}`, string>): CSSProperties {
  return vars as unknown as CSSProperties
}
