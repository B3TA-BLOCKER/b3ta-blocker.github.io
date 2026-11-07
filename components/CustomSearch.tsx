'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from '@/components/Link'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import {
  popularTags,
  recentDocs,
  resultHref,
  searchDocs,
  type Range,
  type SearchDoc,
  type SearchResult,
} from '@/lib/searchEngine'
import { serializeTerms } from '@/lib/searchQuery'

// Search modal: full-text search over titles, tags, headings, summaries, article
// text and code blocks (lib/searchEngine.ts). Opening a result jumps to — and
// highlights — the matching spot in the article (components/SearchHighlighter.tsx).

const INDEX_URL =
  (siteMetadata.search as { kbarConfig?: { searchDocumentsPath?: string } } | undefined)?.kbarConfig
    ?.searchDocumentsPath || '/search.json'

let docsCache: SearchDoc[] | null = null
let docsPromise: Promise<SearchDoc[]> | null = null

function loadDocs(): Promise<SearchDoc[]> {
  if (docsCache) return Promise.resolve(docsCache)
  if (!docsPromise) {
    docsPromise = fetch(INDEX_URL)
      .then((r) => r.json())
      .then((d: SearchDoc[]) => (docsCache = d))
      .catch((e) => {
        docsPromise = null
        throw e
      })
  }
  return docsPromise
}

interface Row {
  doc: SearchDoc
  href: string
  result?: SearchResult
}

const MARK =
  'rounded-sm bg-red-500/15 px-0.5 font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-400'

function Highlighted({ text, ranges }: { text: string; ranges: Range[] }) {
  if (ranges.length === 0) return <>{text}</>
  const out: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach(([s, e], i) => {
    if (s > cursor) out.push(text.slice(cursor, s))
    out.push(
      <mark key={i} className={MARK}>
        {text.slice(s, e)}
      </mark>
    )
    cursor = e
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return <>{out}</>
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
    {children}
  </kbd>
)

const SearchIcon = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.75}
    stroke="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
)

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pt-4 pb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">
      <span className="text-red-500">#</span> {children}
    </p>
  )
}

function Thumb({ doc }: { doc: SearchDoc }) {
  return (
    <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-300 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
      {doc.images?.[0] ? (
        <Image src={doc.images[0]} alt="" fill className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center font-mono text-sm text-gray-500">
          ◆
        </div>
      )}
    </div>
  )
}

function Where({ r }: { r: SearchResult }) {
  const bits: string[] = []
  if (r.excerpt?.heading) bits.push(`§ ${r.excerpt.heading}`)
  if (r.titleRanges.length) bits.push('title')
  if (r.tagHits.size) bits.push(r.tagHits.size === 1 ? 'tag' : `${r.tagHits.size} tags`)
  if (r.inHeading && !r.excerpt?.heading) bits.push('heading')
  if (r.bodyHits) bits.push(`${r.bodyHits}× in text`)
  if (r.codeHits) bits.push(`${r.codeHits}× in code`)
  if (r.partial) bits.push('partial match')
  if (bits.length === 0) return null
  return (
    <p className="mt-1.5 truncate font-mono text-xs text-gray-500">
      <span className="mr-1.5 text-red-500">↳</span>
      {bits.join(' · ')}
    </p>
  )
}

export default function CustomSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[]>(docsCache ?? [])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState(0)
  const [isMac, setIsMac] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const router = useRouter()

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent))
  }, [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Load (once) when first opened.
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelected(0)
      return
    }
    if (!docsCache) {
      setLoading(true)
      setFailed(false)
      loadDocs()
        .then(setDocs)
        .catch(() => setFailed(true))
        .finally(() => setLoading(false))
    }
    const t = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [isOpen])

  // Lock page scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const results = useMemo(() => (query.trim() ? searchDocs(docs, query, 10) : []), [docs, query])

  const rows: Row[] = useMemo(() => {
    if (query.trim()) {
      return results.map((r) => ({ doc: r.doc, result: r, href: resultHref(r, serializeTerms) }))
    }
    return recentDocs(docs, 4).map((d) => ({ doc: d, href: `/${d.path}/` }))
  }, [docs, query, results])

  const suggestions = useMemo(() => popularTags(docs, 6), [docs])

  useEffect(() => setSelected(0), [query])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${selected}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const go = useCallback(
    (row: Row) => {
      setIsOpen(false)
      router.push(row.href)
      // Same-article searches don't remount the page, so tell the highlighter.
      window.setTimeout(() => window.dispatchEvent(new Event('search:navigate')), 160)
    },
    [router]
  )

  // Global shortcuts: Ctrl/⌘+K toggles, "/" opens (when not typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((o) => !o)
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = e.target as HTMLElement | null
        const typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
        if (!typing) {
          e.preventDefault()
          setIsOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Keys while the modal is open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, rows.length - 1))
      } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter' && !e.isComposing) {
        const row = rows[selected]
        if (row) {
          e.preventDefault()
          go(row)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, rows, selected, go, close])

  const hasQuery = query.trim().length > 0

  return (
    <>
      {/* Navbar trigger: a command-palette pill on wide screens, an icon otherwise */}
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Search"
          onClick={open}
          className="group hidden items-center gap-2.5 rounded-md border border-gray-300 bg-white/60 py-1.5 pr-2 pl-3 font-mono text-sm text-gray-500 transition-colors hover:border-red-500/60 hover:text-gray-900 lg:inline-flex dark:border-gray-800 dark:bg-gray-900/40 dark:hover:text-gray-100"
        >
          <SearchIcon className="h-4 w-4" />
          <span className="pr-6">Search</span>
          <Kbd>{isMac ? '⌘ K' : 'Ctrl K'}</Kbd>
        </button>
        <button
          type="button"
          aria-label="Search"
          onClick={open}
          className="hover:text-primary-500 dark:hover:text-primary-400 text-gray-900 lg:hidden dark:text-gray-100"
        >
          <SearchIcon className="h-6 w-6" />
        </button>
      </div>

      {isOpen &&
        createPortal(
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-gray-900/40 px-3 pt-[7vh] backdrop-blur-sm sm:px-6 sm:pt-[11vh] dark:bg-black/70"
            onMouseDown={(e) => e.target === e.currentTarget && close()}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search articles"
              className="flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950"
            >
              {/* Title bar */}
              <div className="flex items-center gap-1.5 border-b border-gray-300 bg-gray-100 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 font-mono text-xs text-gray-500">search.sh</span>
                <span className="ml-auto font-mono text-xs text-gray-500">
                  {docs.length > 0 ? `${docs.length} articles indexed` : ''}
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close search"
                  className="ml-2 hover:opacity-70"
                >
                  <Kbd>esc</Kbd>
                </button>
              </div>

              {/* Prompt */}
              <div className="flex items-center gap-3 border-b border-gray-300 px-5 py-4 dark:border-gray-800">
                <span className="font-mono text-base font-bold text-red-600 dark:text-red-500">
                  $
                </span>
                <span className="hidden font-mono text-base text-gray-500 sm:inline dark:text-gray-400">
                  grep -ri
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-expanded={rows.length > 0}
                  aria-controls="search-results"
                  aria-activedescendant={rows[selected] ? `search-row-${selected}` : undefined}
                  aria-label="Search articles"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search articles, tags, text, code…"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-base text-gray-900 caret-red-500 placeholder:text-gray-400 focus:border-transparent focus:ring-0 focus:outline-none dark:text-gray-100"
                />
                {hasQuery && (
                  <>
                    <span className="shrink-0 font-mono text-xs text-gray-500 tabular-nums">
                      {results.length} {results.length === 1 ? 'result' : 'results'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('')
                        inputRef.current?.focus()
                      }}
                      aria-label="Clear search"
                      className="shrink-0 font-mono text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>

              {/* Results */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loading && (
                  <p className="px-5 py-8 font-mono text-sm text-gray-500">
                    indexing articles…
                    <span
                      className="ml-1 inline-block w-[3px] bg-red-500 align-middle"
                      style={{ height: '1em', animation: 'blink 1s step-end infinite' }}
                    />
                  </p>
                )}
                {failed && (
                  <p className="px-5 py-8 font-mono text-sm text-red-600 dark:text-red-400">
                    $ error: couldn&apos;t load the search index. Try again in a moment.
                  </p>
                )}

                {!loading && !failed && !hasQuery && (
                  <>
                    <SectionLabel>recent articles</SectionLabel>
                  </>
                )}

                {!loading && !failed && hasQuery && rows.length === 0 && (
                  <div className="px-5 py-8 font-mono text-sm">
                    <p className="text-gray-900 dark:text-gray-100">
                      <span className="mr-2 text-red-600 dark:text-red-500">$</span>
                      grep: no matches for &quot;{query.trim()}&quot;
                    </p>
                    <p className="mt-2 text-gray-500">
                      # Try fewer words, a tag name, or a command like{' '}
                      <span className="text-gray-700 dark:text-gray-300">sudo -l</span>.
                    </p>
                  </div>
                )}

                {rows.length > 0 && (
                  <ul
                    id="search-results"
                    role="listbox"
                    ref={listRef}
                    className="space-y-0.5 px-2 pb-2"
                  >
                    {rows.map((row, i) => {
                      const r = row.result
                      const active = i === selected
                      const ex = r?.excerpt
                      return (
                        <li
                          key={row.doc.path}
                          id={`search-row-${i}`}
                          role="option"
                          aria-selected={active}
                          data-row={i}
                          onMouseMove={() => setSelected(i)}
                        >
                          <Link
                            href={row.href}
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey) return
                              e.preventDefault()
                              go(row)
                            }}
                            className={`flex gap-3.5 rounded-lg border-l-2 px-3 py-3 transition-colors ${
                              active
                                ? 'border-red-500 bg-gray-100 dark:bg-gray-900/70'
                                : 'border-transparent'
                            }`}
                          >
                            <Thumb doc={row.doc} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <h3 className="text-base leading-snug font-bold text-gray-900 dark:text-gray-100">
                                  <Highlighted text={row.doc.title} ranges={r?.titleRanges ?? []} />
                                </h3>
                                <span className="hidden shrink-0 font-mono text-xs text-gray-500 sm:inline">
                                  {formatDate(row.doc.date, siteMetadata.locale)}
                                </span>
                              </div>

                              {row.doc.tags.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {row.doc.tags.slice(0, 5).map((t) => (
                                    <span
                                      key={t}
                                      className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${
                                        r?.tagHits.has(t)
                                          ? 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400'
                                          : 'border-gray-300 text-gray-600 dark:border-gray-800 dark:text-gray-400'
                                      }`}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  {row.doc.tags.length > 5 && (
                                    <span className="px-1 font-mono text-[11px] text-gray-500">
                                      +{row.doc.tags.length - 5}
                                    </span>
                                  )}
                                </div>
                              )}

                              {ex && (
                                <p
                                  className={`mt-2 line-clamp-2 leading-relaxed break-words text-gray-700 dark:text-gray-400 ${
                                    ex.source === 'code'
                                      ? 'rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs dark:border-gray-800 dark:bg-gray-900/60'
                                      : 'text-sm'
                                  }`}
                                >
                                  {ex.before && '… '}
                                  <Highlighted text={ex.text} ranges={ex.ranges} />
                                  {ex.after && ' …'}
                                </p>
                              )}
                              {r && <Where r={r} />}
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {!loading && !failed && !hasQuery && suggestions.length > 0 && (
                  <>
                    <SectionLabel>try</SectionLabel>
                    <div className="flex flex-wrap gap-2 px-5 pb-4">
                      {suggestions.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setQuery(t)
                            inputRef.current?.focus()
                          }}
                          className="rounded border border-gray-300 px-2.5 py-1 font-mono text-sm text-gray-700 transition-colors hover:border-red-500/60 hover:text-red-700 dark:border-gray-800 dark:text-gray-300 dark:hover:text-red-400"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="px-5 pb-4 font-mono text-xs text-gray-500">
                      # Searches titles, tags, article text and code. Use &quot;quotes&quot; for an
                      exact phrase; small typos are forgiven.
                    </p>
                  </>
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 border-t border-gray-300 bg-gray-100 px-4 py-2 font-mono text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
                <span className="flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>↵</Kbd> open &amp; jump to match
                </span>
                <span className="ml-auto hidden items-center gap-1.5 sm:flex">
                  <Kbd>esc</Kbd> close
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
