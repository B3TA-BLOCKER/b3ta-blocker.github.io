'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from '@/components/Link'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'

interface SearchDoc {
  title: string
  date: string
  summary: string
  tags: string[]
  path: string
  images?: string[]
  body?: string // plain-text article content, added by contentlayer.config.ts
}

// ---------------------------------------------------------------------------
// Fuzzy search: exact-substring fast path + subsequence fallback (fzf/VSCode
// style), scored with word-boundary and consecutive-run bonuses. Multi-word
// queries require every word to match somewhere (AND semantics). Fields are
// weighted so a title hit always outranks a tag or summary hit.
// ---------------------------------------------------------------------------

const BOUNDARY = /[\s\-_/(]/

interface FieldMatch {
  score: number
  matchedIdx: number[]
}

function scoreField(query: string, text: string): FieldMatch | null {
  if (!query) return { score: 0, matchedIdx: [] }
  const q = query.toLowerCase()
  const t = text.toLowerCase()

  const exactIdx = t.indexOf(q)
  if (exactIdx !== -1) {
    const atBoundary = exactIdx === 0 || BOUNDARY.test(t[exactIdx - 1])
    const idx = Array.from({ length: q.length }, (_, i) => exactIdx + i)
    return { score: 100 + (atBoundary ? 20 : 0) - exactIdx * 0.05, matchedIdx: idx }
  }

  let qi = 0
  let score = 0
  let lastMatch = -1
  let consecutive = 0
  const matchedIdx: number[] = []

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      matchedIdx.push(ti)
      const boundary = ti === 0 || BOUNDARY.test(t[ti - 1])
      consecutive = ti === lastMatch + 1 ? consecutive + 1 : 0
      score += 3 + consecutive * 2 + (boundary ? 6 : 0)
      lastMatch = ti
      qi++
    }
  }

  if (qi < q.length) return null // not every query char found, in order
  score -= (t.length - matchedIdx.length) * 0.15
  return { score, matchedIdx }
}

// Body text is potentially thousands of characters, so it's matched by plain
// substring per word (not fuzzy subsequence) — fuzzy matching over that much
// text would find "matches" almost everywhere and produce noise. It's also
// weighted lowest, so a body-only hit never outranks a title or tag match.
function bodySubstringScore(word: string, bodyLower: string): number | null {
  const idx = bodyLower.indexOf(word)
  if (idx === -1) return null
  const atBoundary = idx === 0 || BOUNDARY.test(bodyLower[idx - 1])
  return 20 + (atBoundary ? 8 : 0)
}

interface BodyExcerpt {
  snippet: string
  ranges: [number, number][]
  leadingEllipsis: boolean
  trailingEllipsis: boolean
}

// Builds a ~140-char window of body text centered on the earliest matching
// query word, snapped to word boundaries, with every matched word's position
// recorded (in snippet-local coordinates) for highlighting.
function buildExcerpt(body: string, words: string[]): BodyExcerpt | null {
  if (!body) return null
  const lower = body.toLowerCase()

  let anchor = -1
  let anchorLen = 0
  for (const w of words) {
    const idx = lower.indexOf(w)
    if (idx !== -1 && (anchor === -1 || idx < anchor)) {
      anchor = idx
      anchorLen = w.length
    }
  }
  if (anchor === -1) return null

  const RADIUS = 70
  let start = Math.max(0, anchor - RADIUS)
  let end = Math.min(body.length, anchor + anchorLen + RADIUS)
  while (start > 0 && !/\s/.test(body[start])) start--
  while (end < body.length && !/\s/.test(body[end])) end++

  const snippet = body.slice(start, end).trim()
  const snippetLower = snippet.toLowerCase()

  const ranges: [number, number][] = []
  for (const w of words) {
    let from = 0
    let idx: number
    while ((idx = snippetLower.indexOf(w, from)) !== -1) {
      ranges.push([idx, idx + w.length])
      from = idx + w.length
    }
  }

  return {
    snippet,
    ranges,
    leadingEllipsis: start > 0,
    trailingEllipsis: end < body.length,
  }
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    const cur = sorted[i]
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1])
    else merged.push(cur)
  }
  return merged
}

function renderExcerpt(excerpt: BodyExcerpt) {
  const merged = mergeRanges(excerpt.ranges)
  const nodes: React.ReactNode[] = []
  let cursor = 0
  merged.forEach(([s, e], i) => {
    if (s > cursor) nodes.push(excerpt.snippet.slice(cursor, s))
    nodes.push(
      <mark
        key={i}
        className="rounded-sm bg-transparent font-semibold"
        style={{ color: '#f85149' }}
      >
        {excerpt.snippet.slice(s, e)}
      </mark>
    )
    cursor = e
  })
  if (cursor < excerpt.snippet.length) nodes.push(excerpt.snippet.slice(cursor))
  return (
    <>
      {excerpt.leadingEllipsis && '… '}
      {nodes}
      {excerpt.trailingEllipsis && ' …'}
    </>
  )
}

interface RankedDoc extends SearchDoc {
  _titleMatches: number[]
  _tagMatches: Set<string>
  _excerpt: BodyExcerpt | null
}

function searchDocs(docs: SearchDoc[], query: string): RankedDoc[] {
  const trimmed = query.trim()
  if (!trimmed)
    return docs.map((d) => ({
      ...d,
      _titleMatches: [],
      _tagMatches: new Set<string>(),
      _excerpt: null,
    }))

  const words = trimmed.toLowerCase().split(/\s+/)
  const scored: {
    doc: SearchDoc
    score: number
    titleMatches: number[]
    tagMatches: Set<string>
    excerpt: BodyExcerpt | null
  }[] = []

  for (const doc of docs) {
    let total = 0
    let matchedAllWords = true
    const titleMatches: number[] = []
    const tagMatches = new Set<string>()

    const bodyLower = (doc.body || '').toLowerCase()

    for (const word of words) {
      const titleRes = scoreField(word, doc.title)
      const tagRes = scoreField(word, doc.tags.join(' '))
      const summaryRes = scoreField(word, doc.summary || '')
      const bodyScore = bodySubstringScore(word, bodyLower)

      const best = Math.max(
        titleRes ? titleRes.score * 3 : -1,
        tagRes ? tagRes.score * 2 : -1,
        summaryRes ? summaryRes.score * 1 : -1,
        bodyScore !== null ? bodyScore * 0.4 : -1
      )

      if (best < 0) {
        matchedAllWords = false
        break
      }
      total += best

      if (titleRes) titleMatches.push(...titleRes.matchedIdx)
      doc.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(word)) tagMatches.add(tag)
      })
    }

    if (matchedAllWords) {
      const excerpt = buildExcerpt(doc.body || '', words)
      scored.push({ doc, score: total, titleMatches, tagMatches, excerpt })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => ({
      ...s.doc,
      _titleMatches: s.titleMatches,
      _tagMatches: s.tagMatches,
      _excerpt: s.excerpt,
    }))
}

function highlightTitle(title: string, matches: number[]) {
  if (matches.length === 0) return title
  const hit = new Set(matches)
  return title.split('').map((ch, i) =>
    hit.has(i) ? (
      <mark
        key={i}
        className="rounded-sm bg-transparent font-semibold"
        style={{ color: '#f85149' }}
      >
        {ch}
      </mark>
    ) : (
      <span key={i}>{ch}</span>
    )
  )
}

export default function CustomSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [allDocs, setAllDocs] = useState<SearchDoc[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const router = useRouter()

  const ranked = useMemo(() => {
    if (!query.trim()) {
      return [...allDocs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
        .map((d) => ({
          ...d,
          _titleMatches: [] as number[],
          _tagMatches: new Set<string>(),
          _excerpt: null as BodyExcerpt | null,
        }))
    }
    return searchDocs(allDocs, query).slice(0, 8)
  }, [query, allDocs])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetch('/search.json')
        .then((res) => res.json())
        .then((data) => setAllDocs(data))
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setSelected(0)
    }
  }, [isOpen])

  useEffect(() => setSelected(0), [query])

  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, ranked.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter') {
        const doc = ranked[selected]
        if (doc) {
          e.preventDefault()
          setIsOpen(false)
          router.push(`/${doc.path}`)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, ranked, selected, router])

  if (!isOpen) {
    return (
      <button aria-label="Search" onClick={() => setIsOpen(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="hover:text-primary-500 dark:hover:text-primary-400 h-7 w-7 text-gray-900 dark:text-gray-100"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </button>
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: '#0d1117', border: '1px solid #21262d' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3.5 px-5 py-4">
          <svg
            style={{ color: '#6e7681' }}
            className="shrink-0"
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, tags..."
            className="flex-1 bg-transparent text-[15px] font-medium outline-none"
            style={{ color: '#e6edf3', caretColor: '#f85149' }}
          />
          <kbd
            className="shrink-0 font-mono"
            style={{
              fontSize: '11px',
              color: '#6e7681',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '2px 7px',
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ height: '1px', background: '#21262d' }} />

        {/* Label */}
        <div className="px-5 pt-3.5 pb-2">
          <p
            style={{ fontSize: '11px', color: '#6e7681', letterSpacing: '0.06em' }}
            className="font-semibold uppercase"
          >
            {query.trim()
              ? `${ranked.length} result${ranked.length !== 1 ? 's' : ''} found`
              : 'Recent articles'}
          </p>
        </div>

        {/* Results */}
        {ranked.length > 0 && (
          <ul className="max-h-[26rem] overflow-y-auto px-2 pb-2">
            {ranked.map((doc, idx) => (
              <li
                key={doc.path}
                ref={(el) => {
                  itemRefs.current[idx] = el
                }}
              >
                <Link
                  href={`/${doc.path}`}
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={() => setSelected(idx)}
                  className="group flex items-center gap-3.5 rounded-xl py-2.5 pr-3 pl-2.5 no-underline transition-colors"
                  style={{
                    borderLeft: idx === selected ? '2px solid #f85149' : '2px solid transparent',
                    background: idx === selected ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}
                >
                  <div
                    className="relative shrink-0 overflow-hidden rounded-[10px]"
                    style={{
                      height: '38px',
                      width: '38px',
                      border: '1px solid #21262d',
                      background: '#161b22',
                    }}
                  >
                    {doc.images?.[0] ? (
                      <Image src={doc.images[0]} alt={doc.title} fill className="object-cover" />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center"
                        style={{ color: '#484f58', fontSize: '15px' }}
                      >
                        ◆
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ fontSize: '14px', fontWeight: 500, color: '#e6edf3' }}
                    >
                      {highlightTitle(doc.title, doc._titleMatches)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span style={{ fontSize: '12px', color: '#6e7681', marginRight: '2px' }}>
                        {formatDate(doc.date, siteMetadata.locale)}
                      </span>
                      {doc.tags?.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="font-mono"
                          style={{
                            fontSize: '10.5px',
                            padding: '1px 6px',
                            borderRadius: '5px',
                            border: doc._tagMatches.has(tag)
                              ? '1px solid rgba(248,81,73,0.35)'
                              : '1px solid #21262d',
                            background: doc._tagMatches.has(tag)
                              ? 'rgba(248,81,73,0.12)'
                              : 'rgba(255,255,255,0.02)',
                            color: doc._tagMatches.has(tag) ? '#f85149' : '#8b949e',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {doc._excerpt && (
                      <p
                        className="mt-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ fontSize: '12px', color: '#8b949e', fontStyle: 'italic' }}
                      >
                        {renderExcerpt(doc._excerpt)}
                      </p>
                    )}
                  </div>

                  <svg
                    className="shrink-0 transition-opacity"
                    style={{
                      color: '#6e7681',
                      opacity: idx === selected ? 1 : 0,
                    }}
                    width="15"
                    height="15"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* No results */}
        {query.trim() && ranked.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p style={{ fontSize: '13px', color: '#8b949e' }}>
              No results for <span style={{ color: '#e6edf3' }}>&ldquo;{query}&rdquo;</span>
            </p>
            <p style={{ fontSize: '11px', color: '#484f58', marginTop: '4px' }}>
              try a different title, tag, or topic
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-5 py-2.5"
          style={{ borderTop: '1px solid #21262d', fontSize: '11.5px', color: '#6e7681' }}
        >
          <span>
            <kbd
              style={{
                border: '1px solid #30363d',
                borderRadius: '4px',
                padding: '1px 5px',
                marginRight: '4px',
              }}
            >
              ↑
            </kbd>
            <kbd
              style={{
                border: '1px solid #30363d',
                borderRadius: '4px',
                padding: '1px 5px',
                marginRight: '6px',
              }}
            >
              ↓
            </kbd>
            navigate
          </span>
          <span>
            <kbd
              style={{
                border: '1px solid #30363d',
                borderRadius: '4px',
                padding: '1px 5px',
                marginRight: '6px',
              }}
            >
              ↵
            </kbd>
            open
          </span>
          <span>
            <kbd
              style={{
                border: '1px solid #30363d',
                borderRadius: '4px',
                padding: '1px 5px',
                marginRight: '6px',
              }}
            >
              esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
