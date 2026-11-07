import { contextKey, parseQuery } from './searchQuery'

// ---------------------------------------------------------------------------
// Full-text search over public/search.json.
//
//  * every query term must match somewhere (AND); if nothing matches them all,
//    the best partial matches are returned instead
//  * fields are weighted: title > tags > headings > summary > prose > code
//  * prefix / substring matching, fuzzy (in-order letters) matching for titles
//    and tags, and one-typo tolerance for longer words found in the text
//  * quoted "phrases" are matched as a unit
//  * each result carries a snippet around the best-matching spot, the section
//    heading it sits under, and what's needed to jump to that exact spot on the
//    post page (terms to highlight + a short context string)
// ---------------------------------------------------------------------------

export interface TocEntry {
  value: string
  url: string
  depth: number
}

export interface SearchDoc {
  title: string
  date: string
  summary?: string
  tags: string[]
  path: string
  images?: string[]
  body?: string
  code?: string
  toc?: TocEntry[]
}

export type Range = [number, number]

export interface Excerpt {
  text: string
  ranges: Range[]
  before: boolean
  after: boolean
  source: 'body' | 'code' | 'summary'
  heading?: string
}

export interface SearchResult {
  doc: SearchDoc
  score: number
  partial: boolean
  titleRanges: Range[]
  tagHits: Set<string>
  inHeading: boolean
  inSummary: boolean
  bodyHits: number
  codeHits: number
  excerpt: Excerpt | null
  /** terms as they actually appear in the text (typos corrected) */
  terms: string[]
  /** lowercase text around the best spot, used to land on that exact spot */
  context: string
}

// --- small helpers -------------------------------------------------------------

const isBoundary = (text: string, idx: number) => idx === 0 || /[^a-z0-9]/.test(text[idx - 1])

function findAll(text: string, term: string, cap = 200): number[] {
  const out: number[] = []
  let from = 0
  let i: number
  while (out.length < cap && (i = text.indexOf(term, from)) !== -1) {
    out.push(i)
    from = i + Math.max(1, term.length)
  }
  return out
}

function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const out: Range[] = [[sorted[0][0], sorted[0][1]]]
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1]
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1])
    else out.push([sorted[i][0], sorted[i][1]])
  }
  return out
}

/** In-order letter match (fzf style) for short fields. */
function fuzzy(query: string, text: string): { score: number; ranges: Range[] } | null {
  let qi = 0
  let score = 0
  let last = -1
  let run = 0
  let first = -1
  const idx: number[] = []
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) {
      if (first === -1) first = ti
      run = ti === last + 1 ? run + 1 : 0
      score += 3 + run * 2 + (isBoundary(text, ti) ? 6 : 0)
      last = ti
      idx.push(ti)
      qi++
    }
  }
  if (qi < query.length) return null
  if (last - first + 1 > query.length * 2.5) return null // too spread out to mean anything
  return {
    score: score - (text.length - idx.length) * 0.1,
    ranges: mergeRanges(idx.map((i) => [i, i + 1])),
  }
}

/** true when a and b differ by at most one insertion, deletion, substitution or swap. */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  const d = a.length - b.length
  if (d > 1 || d < -1) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  if (i === a.length || i === b.length) return true // one extra char at the end
  if (d === 0) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true // substitution
    if (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) return true // swap
    return false
  }
  return d === 1 ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)
}

// --- per-document cache ----------------------------------------------------------

interface Lowered {
  title: string
  summary: string
  body: string
  code: string
  tags: string[]
  headings: string[]
  words?: string[]
  headingPos?: { pos: number; value: string }[]
}

const cache = new WeakMap<SearchDoc, Lowered>()

function lowered(doc: SearchDoc): Lowered {
  let l = cache.get(doc)
  if (!l) {
    l = {
      title: doc.title.toLowerCase(),
      summary: (doc.summary || '').toLowerCase(),
      body: (doc.body || '').toLowerCase(),
      code: (doc.code || '').toLowerCase(),
      tags: doc.tags.map((t) => t.toLowerCase()),
      headings: (doc.toc || []).map((h) => h.value.toLowerCase()),
    }
    cache.set(doc, l)
  }
  return l
}

function wordsOf(l: Lowered): string[] {
  if (!l.words) {
    const set = new Set<string>()
    const re = /[a-z0-9_]{4,}/g
    for (const src of [l.title, l.summary, l.body, l.code]) {
      let m: RegExpExecArray | null
      while ((m = re.exec(src)) !== null) set.add(m[0])
    }
    l.words = Array.from(set)
  }
  return l.words
}

/** Where each section heading starts inside the prose text (for "§ heading" labels). */
function headingAt(doc: SearchDoc, l: Lowered, anchor: number): string | undefined {
  if (!doc.toc || doc.toc.length === 0) return undefined
  if (!l.headingPos) {
    l.headingPos = []
    let cursor = 0
    doc.toc.forEach((h, i) => {
      const pos = l.body.indexOf(l.headings[i], cursor)
      if (pos !== -1) {
        l.headingPos!.push({ pos, value: h.value })
        cursor = pos + l.headings[i].length
      }
    })
  }
  let found: string | undefined
  for (const h of l.headingPos) {
    if (h.pos <= anchor) found = h.value
    else break
  }
  return found
}

// --- scoring ---------------------------------------------------------------------

const W = { title: 3, tags: 2.2, heading: 1.5, summary: 1, body: 1, code: 0.9 }

interface TermHit {
  score: number
  used: string
  titleRanges: Range[]
  tagHits: string[]
  heading: boolean
  summary: boolean
  body: number
  code: number
}

const countScore = (n: number) => (n === 0 ? 0 : Math.min(30, 8 + 5 * Math.log2(n + 1)))

function scoreTerm(doc: SearchDoc, l: Lowered, term: string): TermHit | null {
  const hit: TermHit = {
    score: 0,
    used: term,
    titleRanges: [],
    tagHits: [],
    heading: false,
    summary: false,
    body: 0,
    code: 0,
  }
  const parts: number[] = []
  let strong = false

  // title
  const tIdx = l.title.indexOf(term)
  if (tIdx !== -1) {
    strong = true
    hit.titleRanges = findAll(l.title, term, 5).map((i) => [i, i + term.length] as Range)
    parts.push((60 + (isBoundary(l.title, tIdx) ? 15 : 0) - Math.min(tIdx, 40) * 0.2) * W.title)
  } else if (term.length >= 3 && !term.includes(' ')) {
    const f = fuzzy(term, l.title)
    if (f) {
      hit.titleRanges = f.ranges
      parts.push(f.score * 0.6 * W.title)
    }
  }

  // tags
  let tagBest = 0
  l.tags.forEach((tl, i) => {
    let s = 0
    if (tl === term) s = 55
    else if (tl.startsWith(term)) s = 45
    else if (tl.includes(term)) s = 32
    else if (term.length >= 3 && !term.includes(' ')) {
      const f = fuzzy(term, tl)
      if (f) s = Math.min(14, f.score * 0.4)
    }
    if (s >= 32) {
      strong = true
      hit.tagHits.push(doc.tags[i])
    }
    tagBest = Math.max(tagBest, s)
  })
  if (tagBest) parts.push(tagBest * W.tags)

  // headings
  const hIdx = l.headings.findIndex((h) => h.includes(term))
  if (hIdx !== -1) {
    strong = true
    hit.heading = true
    parts.push(
      (28 + (isBoundary(l.headings[hIdx], l.headings[hIdx].indexOf(term)) ? 6 : 0)) * W.heading
    )
  }

  // summary
  const sIdx = l.summary.indexOf(term)
  if (sIdx !== -1) {
    strong = true
    hit.summary = true
    parts.push((16 + (isBoundary(l.summary, sIdx) ? 4 : 0)) * W.summary)
  }

  // prose + code
  hit.body = findAll(l.body, term).length
  hit.code = findAll(l.code, term).length
  if (hit.body || hit.code) strong = true
  if (hit.body) parts.push((countScore(hit.body) + 3) * W.body)
  if (hit.code) parts.push((countScore(hit.code) + 2) * W.code)

  // one-typo tolerance on longer single words ("privelege" -> "privilege")
  if (!strong && term.length >= 5 && !term.includes(' ')) {
    const w = wordsOf(l).find((x) => x[0] === term[0] && withinOneEdit(term, x))
    if (w) {
      hit.used = w
      hit.body = findAll(l.body, w).length
      hit.code = findAll(l.code, w).length
      if (hit.body) parts.push(countScore(hit.body) * 0.8 * W.body)
      if (hit.code) parts.push(countScore(hit.code) * 0.8 * W.code)
      if (l.title.includes(w)) {
        hit.titleRanges = findAll(l.title, w, 5).map((i) => [i, i + w.length] as Range)
        parts.push(40 * W.title)
      }
      if (!hit.body && !hit.code && hit.titleRanges.length === 0) parts.push(6)
    }
  }

  if (parts.length === 0) return null
  parts.sort((a, b) => b - a)
  hit.score = parts[0] + parts.slice(1).reduce((n, p) => n + p * 0.25, 0)
  return hit
}

/** A "quoted phrase" that never appears verbatim falls back to all its words. */
function scorePhrase(doc: SearchDoc, l: Lowered, term: string): (TermHit | null)[] {
  const whole = scoreTerm(doc, l, term)
  if (whole || !term.includes(' ')) return [whole]
  const words = term.split(' ').filter(Boolean)
  const each = words.map((w) => scoreTerm(doc, l, w))
  return each.every(Boolean) ? each.map((h) => ({ ...h!, score: h!.score * 0.7 })) : [null]
}

// --- excerpts ----------------------------------------------------------------------

const RADIUS = 90

function bestWindow(
  lower: string,
  terms: string[]
): { anchor: number; term: string; distinct: number } | null {
  const occ: { pos: number; term: string }[] = []
  for (const t of terms) for (const pos of findAll(lower, t, 120)) occ.push({ pos, term: t })
  if (occ.length === 0) return null
  occ.sort((a, b) => a.pos - b.pos)
  let best = { anchor: occ[0].pos, term: occ[0].term, distinct: 0 }
  for (let i = 0; i < occ.length; i++) {
    const seen = new Set<string>()
    for (let j = i; j < occ.length && occ[j].pos - occ[i].pos <= RADIUS; j++) seen.add(occ[j].term)
    if (seen.size > best.distinct)
      best = { anchor: occ[i].pos, term: occ[i].term, distinct: seen.size }
  }
  return best
}

function makeExcerpt(
  raw: string,
  lower: string,
  anchor: number,
  anchorLen: number,
  terms: string[],
  source: Excerpt['source']
): Excerpt {
  let start = Math.max(0, anchor - 80)
  let end = Math.min(raw.length, anchor + anchorLen + 110)
  while (start > 0 && start < anchor && /\S/.test(raw[start - 1])) start++
  while (end < raw.length && /\S/.test(raw[end])) end++
  const text = raw.slice(start, end).trim()
  const offset = raw.slice(start, end).length - raw.slice(start, end).trimStart().length
  const sl = lower.slice(start + offset, start + offset + text.length)
  const ranges: Range[] = []
  for (const t of terms) for (const p of findAll(sl, t)) ranges.push([p, p + t.length])
  return {
    text,
    ranges: mergeRanges(ranges),
    before: start > 0,
    after: end < raw.length,
    source,
  }
}

function buildExcerpt(doc: SearchDoc, l: Lowered, terms: string[]) {
  const body = doc.body || ''
  const code = doc.code || ''
  const b = bestWindow(l.body, terms)
  const c = bestWindow(l.code, terms)

  let pick: 'body' | 'code' | null = null
  if (b && c) pick = c.distinct > b.distinct ? 'code' : 'body'
  else if (b) pick = 'body'
  else if (c) pick = 'code'

  if (pick === 'body' && b) {
    const ex = makeExcerpt(body, l.body, b.anchor, b.term.length, terms, 'body')
    ex.heading = headingAt(doc, l, b.anchor)
    return { excerpt: ex, context: contextAround(l.body, b.anchor, b.term.length) }
  }
  if (pick === 'code' && c) {
    const ex = makeExcerpt(code, l.code, c.anchor, c.term.length, terms, 'code')
    return { excerpt: ex, context: contextAround(l.code, c.anchor, c.term.length) }
  }
  const s = doc.summary || ''
  if (s) {
    const w = bestWindow(l.summary, terms)
    const ex = makeExcerpt(s, l.summary, w ? w.anchor : 0, w ? w.term.length : 0, terms, 'summary')
    return { excerpt: ex, context: '' }
  }
  return { excerpt: null, context: '' }
}

function contextAround(lower: string, anchor: number, len: number): string {
  return contextKey(lower.slice(Math.max(0, anchor - 24), anchor + len + 24))
}

// --- public API ---------------------------------------------------------------------

export function searchDocs(docs: SearchDoc[], query: string, limit = 10): SearchResult[] {
  const terms = parseQuery(query)
  if (terms.length === 0) return []

  const run = (requireAll: boolean) => {
    const out: SearchResult[] = []
    for (const doc of docs) {
      const l = lowered(doc)
      const hits = terms.flatMap((t) => scorePhrase(doc, l, t))
      const matched = hits.filter((h): h is TermHit => h !== null)
      if (matched.length === 0 || (requireAll && matched.length < hits.length)) continue

      let score = matched.reduce((n, h) => n + h.score, 0)
      if (terms.length > 1) {
        const phrase = terms.join(' ')
        if (l.title.includes(phrase)) score += 40
        else if (l.body.includes(phrase)) score += 25
      }
      if (matched.length < hits.length) score *= 0.5

      const used = Array.from(new Set(matched.map((h) => h.used)))
      const { excerpt, context } = buildExcerpt(doc, l, used)
      out.push({
        doc,
        score,
        partial: matched.length < hits.length,
        titleRanges: mergeRanges(matched.flatMap((h) => h.titleRanges)),
        tagHits: new Set(matched.flatMap((h) => h.tagHits)),
        inHeading: matched.some((h) => h.heading),
        inSummary: matched.some((h) => h.summary),
        bodyHits: matched.reduce((n, h) => n + h.body, 0),
        codeHits: matched.reduce((n, h) => n + h.code, 0),
        excerpt,
        terms: used,
        context,
      })
    }
    return out
  }

  let results = run(true)
  if (results.length === 0 && terms.length > 1) results = run(false)
  results.sort((a, b) => b.score - a.score || +new Date(b.doc.date) - +new Date(a.doc.date))
  return results.slice(0, limit)
}

/** Link to a result. When the text matched, it carries what the post page needs
 *  to highlight the hits and scroll to the right one. */
export function resultHref(r: SearchResult, serialize: (t: string[]) => string): string {
  const base = `/${r.doc.path}/`
  if (r.bodyHits + r.codeHits === 0) return base
  const params = new URLSearchParams({ q: serialize(r.terms) })
  if (r.context) params.set('c', r.context)
  return `${base}?${params.toString()}`
}

export function recentDocs(docs: SearchDoc[], n = 4): SearchDoc[] {
  return [...docs].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, n)
}

const GENERIC_TAGS = new Set([
  'machine',
  'linux',
  'windows',
  'easy',
  'medium',
  'hard',
  'very easy',
  'hackthebox',
  'vulnhub',
])

/** Most-used topical tags, for the "try:" suggestions. */
export function popularTags(docs: SearchDoc[], n = 6): string[] {
  const counts = new Map<string, number>()
  for (const d of docs)
    for (const t of d.tags) {
      const k = t.toLowerCase()
      if (!GENERIC_TAGS.has(k)) counts.set(k, (counts.get(k) || 0) + 1)
    }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([t]) => t)
}
