#!/usr/bin/env python3
"""
Proves the published résumé does not contain the redacted personal details.

A visual check is worthless here: text covered by a white or black rectangle
still extracts, still copy-pastes, and still turns up in search indexes. So
this checks four independent layers and fails loudly on any hit:

  1. the extracted text layer of every page
  2. every PDF object and every DECOMPRESSED stream in the xref table --
     catches text that survives in an orphaned/unreferenced object
  3. the raw file bytes -- catches anything stored uncompressed
  4. link annotations and document metadata (incl. XMP)

It also asserts the two corrections actually landed, so a silent no-op edit
cannot pass.

Exit 0 = safe to ship. Exit 1 = do not ship.

Run: python scripts/verify-resume.py
"""
import json
import re
import sys
from pathlib import Path

import fitz

# Windows consoles default to cp1252, which cannot encode the box-drawing and
# arrow characters below. Without this the script dies on its own output.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "public" / "assets" / "Santosh-Kumaar-Resume.pdf"

# The strings we are checking for are themselves private, so they live in a
# gitignored file rather than in this source. This repo is public: hardcoding
# the number here publishes the exact value the script exists to remove.
TARGETS = ROOT / "scripts" / "redaction-targets.json"
if not TARGETS.exists():
    sys.exit(
        f"Missing {TARGETS.name}. It is gitignored by design — see .gitignore.\n"
        "Recreate it with the keys: phone, phone_variants, email.\n"
        "Refusing to run: a verifier with nothing to look for would pass "
        "vacuously, which is worse than not running at all."
    )
_t = json.loads(TARGETS.read_text(encoding="utf-8"))

# Must be absent. Phone variants cover common separator styles.
FORBIDDEN = [
    ("mobile number", _t["phone"]),
    *(
        (f"mobile number (variant {i + 1})", v)
        for i, v in enumerate(_t["phone_variants"])
    ),
    ("personal email", _t["email"]),
    ("personal email local part", _t["email"].split("@")[0]),
    ("mailto: link", "mailto:"),
]

# Must be present -- guards against an edit that silently did nothing.
REQUIRED_TEXT = ["GPA: 8.8/10.0", "Last updated July 2026"]
# Must be gone -- the superseded values.
SUPERSEDED = ["GPA: 8.7/10.0", "Last updated November 2025"]


def norm(s):
    """Collapse whitespace so a hit split across PDF text ops still matches."""
    return re.sub(r"\s+", "", s)


def main():
    if not PDF.exists():
        print(f"FAIL: {PDF} does not exist -- run scripts/build-resume.py first")
        return 1

    doc = fitz.open(PDF)
    failures = []
    print(f"Verifying {PDF.relative_to(ROOT)} ({PDF.stat().st_size:,} bytes, "
          f"{doc.page_count} pages)\n")

    # --- layer 1: text layer ----------------------------------------------
    pages_text = [doc[i].get_text("text") for i in range(doc.page_count)]
    all_text = "\n".join(pages_text)
    squashed = norm(all_text)
    for label, needle in FORBIDDEN:
        hits = [i + 1 for i, t in enumerate(pages_text)
                if needle.lower() in t.lower() or norm(needle).lower() in norm(t).lower()]
        status = "FAIL" if hits else "ok"
        if hits:
            failures.append(f"{label} found in text layer of page(s) {hits}")
        print(f"  [{status:4s}] text layer      · {label:28s} · {needle!r}")

    # --- layer 2: every object + decompressed stream ------------------------
    obj_hits = {label: [] for label, _ in FORBIDDEN}
    for xref in range(1, doc.xref_length()):
        blobs = []
        try:
            blobs.append(doc.xref_object(xref, compressed=False) or "")
        except Exception:
            pass
        if doc.xref_is_stream(xref):
            try:
                blobs.append(doc.xref_stream(xref).decode("latin-1", "replace"))
            except Exception:
                pass
        for blob in blobs:
            low = blob.lower()
            for label, needle in FORBIDDEN:
                if needle.lower() in low:
                    obj_hits[label].append(xref)
    for label, needle in FORBIDDEN:
        hits = sorted(set(obj_hits[label]))
        status = "FAIL" if hits else "ok"
        if hits:
            failures.append(f"{label} found in PDF object(s) {hits}")
        print(f"  [{status:4s}] objects+streams · {label:28s} · {needle!r}")

    # --- layer 3: raw file bytes ------------------------------------------
    raw = PDF.read_bytes().lower()
    for label, needle in FORBIDDEN:
        hit = needle.lower().encode("latin-1") in raw
        status = "FAIL" if hit else "ok"
        if hit:
            failures.append(f"{label} found in raw file bytes")
        print(f"  [{status:4s}] raw bytes       · {label:28s} · {needle!r}")

    # --- layer 4: annotations + metadata ----------------------------------
    uris = []
    for i in range(doc.page_count):
        for link in doc[i].get_links():
            if link.get("uri"):
                uris.append((i + 1, link["uri"]))
    bad_uris = [u for u in uris
                if "mailto" in u[1].lower() or "rsantoshkumaar" in u[1].lower()]
    if bad_uris:
        failures.append(f"forbidden link annotation(s): {bad_uris}")
    print(f"\n  [{'FAIL' if bad_uris else 'ok':4s}] link annotations · "
          f"{len(uris)} link(s) remain, none personal")
    for pno, uri in uris:
        print(f"           p{pno} → {uri}")

    meta_blob = " ".join(str(v) for v in doc.metadata.values() if v)
    xml_meta = doc.get_xml_metadata() or ""
    meta_bad = [n for _l, n in FORBIDDEN
                if n.lower() in (meta_blob + xml_meta).lower()]
    if meta_bad:
        failures.append(f"forbidden value in metadata: {meta_bad}")
    print(f"  [{'FAIL' if meta_bad else 'ok':4s}] metadata         · "
          f"{doc.metadata.get('title')!r} · XMP {len(xml_meta)} bytes")

    # --- corrections actually landed --------------------------------------
    print()
    for needle in REQUIRED_TEXT:
        present = norm(needle).lower() in squashed.lower()
        if not present:
            failures.append(f"expected corrected text missing: {needle!r}")
        print(f"  [{'ok' if present else 'FAIL':4s}] correction present · {needle!r}")
    for needle in SUPERSEDED:
        gone = norm(needle).lower() not in squashed.lower()
        if not gone:
            failures.append(f"superseded value still present: {needle!r}")
        print(f"  [{'ok' if gone else 'FAIL':4s}] superseded gone    · {needle!r}")

    doc.close()

    print()
    if failures:
        print(f"VERIFICATION FAILED — {len(failures)} problem(s). DO NOT SHIP.")
        for f in failures:
            print(f"  ✗ {f}")
        return 1
    print("VERIFICATION PASSED — mobile number and personal email are absent from")
    print("the text layer, every object and stream, the raw bytes, the link")
    print("annotations and the metadata. Safe to ship.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
