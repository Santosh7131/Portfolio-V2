#!/usr/bin/env node
/*
 * Confidentiality backstop for the TalbotIQ material in src/scenes/work/.
 *
 * ─── READ THIS BEFORE TRUSTING IT ──────────────────────────────────────────
 * A PASSING RUN DOES NOT MEAN THE COPY IS CLEARED.
 *
 * This is a fixed word list. It catches the literal terms someone might paste
 * or copy in by accident. It cannot catch a paraphrase — "about a hundred and
 * seventy-five dollars a month", "the sales pipeline product", "we found a way
 * in through the review endpoint" would all sail straight through, and each is
 * exactly the kind of leak that matters.
 *
 * The real boundary is the comment block at the top of WorkScene.tsx and human
 * judgement. This script only stops the dumbest version of the mistake.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Run: node scripts/check-confidential.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, not .pathname — this project's directory contains spaces,
// which .pathname hands back percent-encoded.
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')

/** Literal terms that must never appear in shipped source. */
const FORBIDDEN = [
  // Their product surface and internal identifiers
  { pattern: /\bcrm_[a-z_]+/i, why: 'internal task identifier' },
  { pattern: /\bcrm\b/i, why: "their product surface" },
  { pattern: /task management|meeting tool|HR\/performance/i, why: 'their product surface' },
  // Cost model
  { pattern: /\$175|\$0\.001|\$0\.00004|\$4,?400/i, why: 'cost model' },
  { pattern: /break-?even/i, why: 'cost model' },
  { pattern: /200,?000 requests|4\.4M requests/i, why: 'cost model' },
  { pattern: /25× cheaper|25x cheaper/i, why: 'cost model' },
  // Vendor
  { pattern: /\bgemini\b/i, why: 'third-party cloud vendor' },
  // Security findings — no exceptions
  { pattern: /vulnerabilit|prompt.?injection|authorization (hole|gap)/i, why: 'security finding' },
  { pattern: /denial.of.service/i, why: 'security finding' },
  // Case-SENSITIVE: a case-insensitive \bDoS\b matches "js-dos" and ".ar-dos"
  // in the arcade, which are the DOS emulator, not a denial-of-service note.
  { pattern: /\bDoS\b/, why: 'security finding' },
  // Accuracy: never imply deployment
  { pattern: /in production\b(?!\.)/i, why: 'implies production use' },
  { pattern: /serving (live|real) (traffic|users)|live traffic|real users/i, why: 'implies production use' },
]

/** WorkScene documents the boundary and legitimately names what NOT to do. */
const EXEMPT = ['src/scenes/work/WorkScene.tsx']

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full)
  }
  return out
}

let failures = 0
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).split('\\').join('/')
  if (EXEMPT.includes(rel)) continue
  const text = readFileSync(file, 'utf8')
  for (const { pattern, why } of FORBIDDEN) {
    const hit = pattern.exec(text)
    if (hit) {
      const line = text.slice(0, hit.index).split('\n').length
      console.error(`✗ ${rel}:${line} — ${why}: "${hit[0]}"`)
      failures++
    }
  }
}

if (failures) {
  console.error(`\n${failures} forbidden term(s) found. See the header of this file.`)
  process.exit(1)
}
console.log('✓ No forbidden literals in src/. This is a backstop, NOT a clearance.')
