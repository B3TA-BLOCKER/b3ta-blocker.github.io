import { normalizeWithMap } from './searchQuery'

// DOM helpers for highlighting search hits inside a rendered post.
// Text is gathered from every text node under the article, matched as one
// string (so a hit can span syntax-highlighted <span>s in a code block), then
// mapped back to DOM Ranges.

interface Seg {
  node: Text
  start: number
  end: number
}

export interface PageMatch {
  start: number
  end: number
  range: Range
}

const BLOCK =
  'p,li,h1,h2,h3,h4,h5,h6,pre,blockquote,td,th,tr,figure,figcaption,div,section,details,summary'

export function collectText(root: Element): { text: string; segs: Seg[] } {
  const segs: Seg[] = []
  let text = ''
  let prevBlock: Element | null = null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement
      if (!p || !n.nodeValue) return NodeFilter.FILTER_REJECT
      if (p.closest('script,style,noscript,[data-search-ignore]')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = n as Text
    const block = t.parentElement!.closest(BLOCK)
    // A virtual newline between blocks keeps "end of one paragraph" and
    // "start of the next" from fusing into a single fake word.
    if (prevBlock && block !== prevBlock) text += '\n'
    prevBlock = block
    segs.push({ node: t, start: text.length, end: text.length + t.data.length })
    text += t.data
  }
  return { text, segs }
}

function lowerSameLength(s: string): string {
  const l = s.toLowerCase()
  if (l.length === s.length) return l
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i].toLowerCase()
    out += c.length === 1 ? c : s[i]
  }
  return out
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function locate(segs: Seg[], pos: number): Seg | null {
  let lo = 0
  let hi = segs.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (pos < segs[mid].start) hi = mid - 1
    else if (pos >= segs[mid].end) lo = mid + 1
    else return segs[mid]
  }
  return null
}

export function findMatches(text: string, segs: Seg[], terms: string[]): PageMatch[] {
  const lower = lowerSameLength(text)
  const found: { start: number; end: number }[] = []
  for (const term of terms) {
    if (!term) continue
    const re = new RegExp(escapeRe(term).replace(/ +/g, '\\s+'), 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(lower)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++
        continue
      }
      found.push({ start: m.index, end: m.index + m[0].length })
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end)

  // drop matches swallowed by an earlier, longer one
  const out: PageMatch[] = []
  let lastEnd = -1
  for (const f of found) {
    if (f.start < lastEnd) continue
    const a = locate(segs, f.start)
    const b = locate(segs, f.end - 1)
    if (!a || !b) continue
    const range = document.createRange()
    range.setStart(a.node, f.start - a.start)
    range.setEnd(b.node, f.end - b.start)
    out.push({ ...f, range })
    lastEnd = f.end
  }
  return out
}

/** Index of the match the result link pointed at, using its context string. */
export function pickMatch(text: string, matches: PageMatch[], context: string): number {
  if (!context || matches.length === 0) return 0
  const { norm, map } = normalizeWithMap(text)
  const tries = [context, context.slice(8, -8), context.slice(14, -14)].filter(
    (c) => c.length >= 12
  )
  for (const c of tries) {
    const ci = norm.indexOf(c)
    if (ci === -1) continue
    const lo = map[ci]
    const hi = map[Math.min(ci + c.length - 1, map.length - 1)]
    const idx = matches.findIndex((m) => m.start >= lo && m.start <= hi)
    if (idx !== -1) return idx
  }
  return 0
}

export interface Highlighter {
  count: number
  setActive: (i: number) => void
  rectOf: (i: number) => DOMRect
  clear: () => void
}

export function applyHighlights(matches: PageMatch[]): Highlighter {
  const css =
    typeof CSS !== 'undefined'
      ? (CSS as unknown as { highlights?: Map<string, unknown> })
      : undefined
  const HighlightCtor = (window as unknown as { Highlight?: new (...r: Range[]) => unknown })
    .Highlight

  // Preferred: CSS Custom Highlight API — paints the hits without touching the DOM.
  if (css?.highlights && HighlightCtor) {
    const highlights = css.highlights
    const ranges = matches.map((m) => m.range)
    return {
      count: ranges.length,
      setActive(i) {
        highlights.set('search-hit', new HighlightCtor(...ranges.filter((_, k) => k !== i)))
        highlights.set('search-hit-active', new HighlightCtor(ranges[i]))
      },
      rectOf: (i) => ranges[i].getBoundingClientRect(),
      clear() {
        highlights.delete('search-hit')
        highlights.delete('search-hit-active')
      },
    }
  }

  // Fallback: wrap each hit in <mark>. Done last-to-first so earlier offsets stay valid.
  const marks: (HTMLElement | null)[] = new Array(matches.length).fill(null)
  for (let i = matches.length - 1; i >= 0; i--) {
    const mark = document.createElement('mark')
    mark.className = 'search-hit'
    try {
      matches[i].range.surroundContents(mark)
      marks[i] = mark
    } catch {
      /* a hit that straddles element boundaries is skipped in the fallback */
    }
  }
  return {
    count: matches.length,
    setActive(i) {
      marks.forEach((m, k) => m?.classList.toggle('search-hit-active', k === i))
    },
    rectOf: (i) =>
      (marks[i] ?? { getBoundingClientRect: () => new DOMRect() }).getBoundingClientRect(),
    clear() {
      marks.forEach((m) => {
        if (!m || !m.parentNode) return
        const parent = m.parentNode
        m.replaceWith(...Array.from(m.childNodes))
        parent.normalize()
      })
    },
  }
}
