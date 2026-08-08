#!/usr/bin/env python3
"""
Generates the site's social and icon assets from the site's own type and palette.

Outputs:
  public/favicon.svg            — Fraunces 'S', outlined (no font dependency)
  public/apple-touch-icon.png   — 180x180, same mark
  public/assets/og-cover.png    — 1200x630 Open Graph / Twitter card

Everything is derived from source rather than hand-copied:

  · Type comes from the @fontsource-variable faces already in node_modules.
    They ship as woff2 only, so each is decompressed and then INSTANCED at the
    exact axis values the hero uses (Fraunces opsz 144 / wght 350 / SOFT 0 /
    WONK 1). Instancing to a static face — rather than asking the rasteriser
    for a variable instance — is what guarantees the OG image and the favicon
    show the same cut as the live cover.
  · Colour comes from the oklch() values authored in hero.css, converted here.
    Keeping the conversion in code means the palette has one home, not two.

The favicon glyph is emitted as a PATH. An SVG favicon that referenced
'Fraunces' by name would silently fall back to a system serif on every machine
that does not have it, which is most of them.

Run: python scripts/build-brand-assets.py
"""
import io
import math
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import decompress
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
MODULES = ROOT / "node_modules" / "@fontsource-variable"
FRAUNCES = MODULES / "fraunces" / "files" / "fraunces-latin-full-normal.woff2"
NEWSREADER = MODULES / "newsreader" / "files" / "newsreader-latin-standard-normal.woff2"
BUILD = ROOT / "scripts" / ".fontcache"

OG_PATH = ROOT / "public" / "assets" / "og-cover.png"
FAVICON_PATH = ROOT / "public" / "favicon.svg"
TOUCH_PATH = ROOT / "public" / "apple-touch-icon.png"

# Authored in src/scenes/hero/hero.css — the cover's palette, not a new one.
HERO_BG = (0.135, 0.006, 262)
HERO_INK = (0.97, 0.004, 262)
HERO_MUTED = (0.62, 0.008, 262)
HERO_ACCENT = (0.72, 0.17, 262)
HAIRLINE_L = (0.95, 0.01, 262)
HAIRLINE_ALPHA = 0.14

# Copy is lifted verbatim from HeroScene so the card cannot drift from the page.
ROLE = "Machine learning engineer"
PLACE = "Chennai, India"
NAME = "Santosh"
LINE = "Machine learning that runs on ordinary hardware."
CUE = "Profile · Work · Craft"

OG_W, OG_H = 1200, 630
# --page-gutter's clamp() ceiling; the card is fixed-width so the max applies.
GUTTER = 88


# --------------------------------------------------------------------------
# colour
# --------------------------------------------------------------------------
def oklch_to_srgb(l, c, h_deg, alpha=None, over=None):
    """oklch() -> 8-bit sRGB. `over` composites a translucent colour first."""
    h = math.radians(h_deg)
    a, b = c * math.cos(h), c * math.sin(h)
    l_ = l + 0.3963377774 * a + 0.2158037573 * b
    m_ = l - 0.1055613458 * a - 0.0638541728 * b
    s_ = l - 0.0894841775 * a - 1.2914855480 * b
    L, M, S = l_**3, m_**3, s_**3
    lin = (
        4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
        -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
        -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S,
    )

    def encode(v):
        v = max(0.0, min(1.0, v))
        return 1.055 * v ** (1 / 2.4) - 0.055 if v > 0.0031308 else 12.92 * v

    rgb = [encode(v) for v in lin]
    if alpha is not None and over is not None:
        rgb = [f * alpha + (o / 255) * (1 - alpha) for f, o in zip(rgb, over)]
    return tuple(int(round(v * 255)) for v in rgb)


def to_hex(rgb):
    return "#%02x%02x%02x" % rgb


# --------------------------------------------------------------------------
# type
# --------------------------------------------------------------------------
def instance_face(woff2_path, axes, tag):
    """woff2 -> static TTF pinned at `axes`, cached on disk for Pillow."""
    BUILD.mkdir(parents=True, exist_ok=True)
    out = BUILD / f"{tag}.ttf"
    buf = io.BytesIO()
    decompress(str(woff2_path), buf)
    buf.seek(0)
    font = TTFont(buf)
    static = instancer.instantiateVariableFont(font, axes, inplace=True)
    static.save(str(out))
    return out, static


def draw_tracked(draw, xy, text, font, fill, tracking=0.0, anchor_right=False):
    """Pillow has no letter-spacing, so glyphs are placed one at a time."""
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * max(0, len(text) - 1)
    x, y = xy
    if anchor_right:
        x -= total
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += w + tracking
    return total


def main():
    for p in (FRAUNCES, NEWSREADER):
        if not p.exists():
            raise SystemExit(f"font not found: {p}\nrun npm install first")

    bg = oklch_to_srgb(*HERO_BG)
    ink = oklch_to_srgb(*HERO_INK)
    muted = oklch_to_srgb(*HERO_MUTED)
    accent = oklch_to_srgb(*HERO_ACCENT)
    hairline = oklch_to_srgb(*HAIRLINE_L, alpha=HAIRLINE_ALPHA, over=bg)

    # Hero name cut: opsz 144, wght 350, SOFT 0, WONK 1 (hero.css).
    display_path, display_ttf = instance_face(
        FRAUNCES, {"opsz": 144, "wght": 350, "SOFT": 0, "WONK": 1}, "fraunces-display"
    )
    # .hr-line is font-weight 300 body copy.
    body_path, _ = instance_face(
        NEWSREADER, {"wght": 300, "opsz": 18}, "newsreader-body"
    )
    # .hr-role / .hr-place / .hr-cue-label are 500 at small sizes.
    rail_path, _ = instance_face(
        NEWSREADER, {"wght": 500, "opsz": 12}, "newsreader-rail"
    )

    # ---------------- OG card ------------------------------------------------
    img = Image.new("RGB", (OG_W, OG_H), bg)
    d = ImageDraw.Draw(img)

    f_rail = ImageFont.truetype(str(rail_path), 17)
    f_name = ImageFont.truetype(str(display_path), 176)
    f_line = ImageFont.truetype(str(body_path), 31)
    f_cue = ImageFont.truetype(str(rail_path), 16)

    # Top rail: role left, place right, hairline beneath — as on the cover.
    draw_tracked(d, (GUTTER, 66), ROLE.upper(), f_rail, muted, tracking=3.4)
    draw_tracked(
        d, (OG_W - GUTTER, 66), PLACE.upper(), f_rail, muted, tracking=3.4,
        anchor_right=True,
    )
    d.rectangle([GUTTER, 104, OG_W - GUTTER, 104], fill=hairline)

    # Masthead, optically seated above centre like the hero's grid.
    d.text((GUTTER - 8, 300), NAME, font=f_name, fill=ink, anchor="ls")
    d.text((GUTTER, 372), LINE, font=f_line, fill=muted, anchor="la")

    # Cue: accent tick then the label, on the floor.
    tick_y = OG_H - 74
    d.rectangle([GUTTER, tick_y, GUTTER + 22, tick_y + 1], fill=accent)
    draw_tracked(d, (GUTTER + 36, tick_y - 9), CUE.upper(), f_cue, muted, tracking=3.0)

    OG_PATH.parent.mkdir(parents=True, exist_ok=True)
    img.save(OG_PATH, "PNG", optimize=True)

    # ---------------- favicon ------------------------------------------------
    # 'S' as an outline, scaled into a 64-unit box.
    glyphs = display_ttf.getGlyphSet()
    upem = display_ttf["head"].unitsPerEm
    pen = SVGPathPen(glyphs)
    glyphs["S"].draw(pen)
    path_d = pen.getCommands()

    xmin, ymin, xmax, ymax = display_ttf["glyf"]["S"].xMin, display_ttf["glyf"]["S"].yMin, \
        display_ttf["glyf"]["S"].xMax, display_ttf["glyf"]["S"].yMax
    box, target = 64, 40.0
    scale = target / max(xmax - xmin, ymax - ymin)
    tx = (box - (xmax - xmin) * scale) / 2 - xmin * scale
    ty = (box + (ymax - ymin) * scale) / 2 + ymin * scale

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" role="img" aria-label="Santosh">
  <title>Santosh</title>
  <!-- Generated by scripts/build-brand-assets.py — do not hand-edit.
       Fraunces 'S' at the cover's cut (opsz 144, wght 350, WONK 1), outlined
       so it renders identically without the font installed. -->
  <rect width="{box}" height="{box}" fill="{to_hex(bg)}"/>
  <g transform="translate({tx:.3f} {ty:.3f}) scale({scale:.6f} -{scale:.6f})">
    <path d="{path_d}" fill="{to_hex(ink)}"/>
  </g>
</svg>
"""
    FAVICON_PATH.write_text(svg, encoding="utf-8")

    # ---------------- apple-touch-icon --------------------------------------
    # iOS rounds the corners itself, so this is full-bleed. The glyph is placed
    # by its own ink bounds, not by font metrics: anchor='mm' centres on ascent
    # and descent, which seats an 'S' visibly high and small. Measuring keeps
    # this mark on the same 62.5%-of-box proportion as favicon.svg.
    side = 180
    touch = Image.new("RGB", (side, side), bg)
    td = ImageDraw.Draw(touch)
    probe_size = 100
    probe = ImageFont.truetype(str(display_path), probe_size)
    px0, py0, px1, py1 = td.textbbox((0, 0), "S", font=probe)
    size = int(round(probe_size * (side * (target / box)) / max(px1 - px0, py1 - py0)))
    f_mark = ImageFont.truetype(str(display_path), size)
    gx0, gy0, gx1, gy1 = td.textbbox((0, 0), "S", font=f_mark)
    td.text(
        ((side - (gx1 - gx0)) / 2 - gx0, (side - (gy1 - gy0)) / 2 - gy0),
        "S",
        font=f_mark,
        fill=ink,
    )
    touch.save(TOUCH_PATH, "PNG", optimize=True)

    for p in (OG_PATH, FAVICON_PATH, TOUCH_PATH):
        print(f"  {p.relative_to(ROOT).as_posix():38s} {p.stat().st_size:>7,} bytes")
    print(f"\n  palette: bg {to_hex(bg)} · ink {to_hex(ink)} · muted {to_hex(muted)}")
    print(f"           accent {to_hex(accent)} · hairline {to_hex(hairline)}")
    print(f"  theme-color for index.html: {to_hex(bg)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
