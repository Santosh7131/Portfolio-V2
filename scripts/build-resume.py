#!/usr/bin/env python3
"""
Builds the public, redacted résumé from Context/Santosh_Resume_V5.pdf.

Output: public/assets/Santosh-Kumaar-Resume.pdf

Three edits, all done at the content-stream level so the removed text is
genuinely gone from the file rather than covered over:

  1. Mobile number and personal email are REDACTED — the glyphs are deleted
     from the content stream and the mailto: link annotation is removed. A
     black box or a white rectangle drawn on top would leave the text
     extractable, which is the whole failure mode this has to avoid.
     Removing them leaves the line as two groups: location flush left, the
     three profile links flush right. That reads as a deliberate justified
     contact line, so no reflow is needed.
  2. GPA 8.7 -> 8.8. The WHOLE "GPA: 8.8/10.0" run is redacted and redrawn as
     one text object. Swapping just the '7' glyph also renders correctly, but
     the replacement lands in its own text block, so the line extracts as
     "GPA: 8. /10.0" with a detached '8' -- and a résumé is read by parsers,
     not only by eyes. Digits are tabular (4.95pt at 9.96), so the redrawn
     run is width-identical and nothing after it shifts.
  3. "Last updated" is re-dated. The embedded SourceSansPro-It subset does
     NOT contain 6, J, l or y, so no 2026 date can be set in it. The line is
     redrawn from the Regular subset with a shear matrix instead: same family,
     same size, same grey, synthesised slant. Noted here because a faux
     oblique is normally the wrong answer -- here it is the only one that
     keeps the typeface.

Fonts are lifted out of the PDF itself (extract_font), so the inserted text
matches the surrounding type exactly and nothing new is embedded.

Run: python scripts/build-resume.py
Verify: python scripts/verify-resume.py   (asserts the PII is actually gone)
"""
import json
import math
import sys
from pathlib import Path

import fitz

# Windows consoles default to cp1252 and cannot encode this script's output.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Context" / "Santosh_Resume_V5.pdf"
OUT = ROOT / "public" / "assets" / "Santosh-Kumaar-Resume.pdf"

# Kept out of this source: the repo is public, and writing the number here
# would publish the exact value this script exists to strip. See .gitignore.
TARGETS = ROOT / "scripts" / "redaction-targets.json"
if not TARGETS.exists():
    sys.exit(
        f"Missing {TARGETS.name}. It is gitignored by design — see .gitignore.\n"
        "Recreate it with the keys: phone, phone_variants, email."
    )
_t = json.loads(TARGETS.read_text(encoding="utf-8"))
PHONE = _t["phone"]
EMAIL = _t["email"]

# Redaction spans, measured from the source PDF (see scripts/ notes above).
# x0 starts clear of "Tamilnadu"'s last glyph (ends 149.6) and stops clear of
# the Portfolio icon group (starts 401.0).
CONTACT_STRIP = fitz.Rect(150.2, 84.0, 401.0, 97.5)
# The whole value run, clear of the list bullet (ends 115.53) and its indent.
GPA_RUN = fitz.Rect(120.55, 257.0, 175.0, 268.5)
GPA_ORIGIN = fitz.Point(120.51, 265.72)
GPA_SIZE = 9.96
NEW_GPA = "GPA: 8.8/10.0"
FOOTER_SPAN = fitz.Rect(501.0, 29.5, 609.5, 40.5)
FOOTER_BASELINE_Y = 37.47
FOOTER_RIGHT_X = 608.63
FOOTER_SIZE = 8.97
FOOTER_GREY = (127 / 255, 128 / 255, 127 / 255)
FOOTER_ASCENDER = 0.724  # from the source span, for the slant overhang
NEW_DATE = "Last updated July 2026"
SLANT_DEGREES = 12.0  # Source Sans Pro Italic's angle

# The embedded subsets carry no space glyph, so TextWriter would silently fall
# back to a serif face and embed a whole extra font for three blanks. Words are
# placed individually instead and the gap is advanced by hand. Source Sans
# Pro's space is 0.2em -- confirmed against this PDF's own metrics (1.99pt at
# 9.96, 1.79pt at 8.97).
SPACE_EM = 0.2


def run_width(font, text, size):
    """Advance width of `text`, counting spaces at SPACE_EM (no space glyph)."""
    return sum(
        size * SPACE_EM if ch == " " else font.text_length(ch, size) for ch in text
    )


def append_run(writer, origin, text, font, size):
    """Append `text` word by word, advancing spaces manually.

    Keeps every glyph in the extracted subset and produces one contiguous
    text object, so the line still extracts as a single readable line.
    """
    x = origin.x
    for i, word in enumerate(text.split(" ")):
        if i:
            x += size * SPACE_EM
        if word:
            writer.append(fitz.Point(x, origin.y), word, font=font, fontsize=size)
            x += font.text_length(word, size)
    return x - origin.x


def load_subset(doc, page, suffix):
    """Pull an embedded font subset out of the document by base-name suffix."""
    for xref, *_rest in page.get_fonts():
        basename = _rest[2]
        if basename.endswith(suffix):
            _n, _e, _t, buf = doc.extract_font(xref)
            if buf:
                return fitz.Font(fontbuffer=buf)
    raise SystemExit(f"could not extract an embedded font ending in {suffix!r}")


def main():
    if not SRC.exists():
        raise SystemExit(f"source résumé not found: {SRC}")
    OUT.parent.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(SRC)
    page = doc[0]
    regular = load_subset(doc, page, "SourceSansPro-Regular")

    # --- 1. drop the mailto: link annotation -------------------------------
    removed_links = 0
    for link in page.get_links():
        if (link.get("uri") or "").lower().startswith("mailto:"):
            page.delete_link(link)
            removed_links += 1

    # --- 2. mark everything that has to go ---------------------------------
    # fill=False: no black box. The point is deletion, not concealment.
    for rect in (CONTACT_STRIP, GPA_RUN, FOOTER_SPAN):
        page.add_redact_annot(rect, fill=False)

    page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=fitz.PDF_REDACT_LINE_ART_NONE,
        text=fitz.PDF_REDACT_TEXT_REMOVE,
    )

    # --- 3. redraw the two corrected values --------------------------------
    gpa = fitz.TextWriter(page.rect, color=(0, 0, 0))
    append_run(gpa, GPA_ORIGIN, NEW_GPA, regular, GPA_SIZE)
    gpa.write_text(page)

    # Right-aligned to the original's right edge so the footer stays flush with
    # the page's other trailing elements. The slant carries the ascenders to the
    # right of the baseline, so the run is inset by that overhang first --
    # otherwise the tallest glyph pokes past the margin the rest respects.
    slant = math.tan(math.radians(SLANT_DEGREES))
    width = run_width(regular, NEW_DATE, FOOTER_SIZE)
    overhang = slant * FOOTER_SIZE * FOOTER_ASCENDER
    start = fitz.Point(FOOTER_RIGHT_X - width - overhang, FOOTER_BASELINE_Y)
    date = fitz.TextWriter(page.rect, color=FOOTER_GREY)
    append_run(date, start, NEW_DATE, regular, FOOTER_SIZE)
    # Positive shear leans the glyphs right, matching a true italic. The sign is
    # the opposite of the naive reading of the matrix -- verified by rendering.
    shear = fitz.Matrix(1, 0, slant, 1, 0, 0)
    date.write_text(page, morph=(start, shear))

    # --- 4. save with the old objects actually collected --------------------
    # garbage=4 + clean rewrites the streams; without it the original content
    # stream can survive in the file as an unreferenced object.
    doc.set_metadata(
        {
            "title": "Santosh Kumaar — Résumé",
            "author": "Santosh Kumaar",
            "subject": "",
            "keywords": "",
            "creator": "",
            "producer": "",
        }
    )
    doc.del_xml_metadata()
    doc.save(OUT, garbage=4, deflate=True, clean=True)
    doc.close()

    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"  removed {removed_links} mailto: link annotation(s)")
    print(f"  redacted phone {PHONE} and email {EMAIL}")
    print(f"  GPA -> 8.8 · footer -> {NEW_DATE!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
