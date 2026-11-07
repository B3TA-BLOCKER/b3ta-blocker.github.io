'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { parseQuery } from '@/lib/searchQuery'
import {
  applyHighlights,
  collectText,
  findMatches,
  pickMatch,
  type Highlighter,
} from '@/lib/pageHighlight'

// Mounted on every post. When the page was opened from the search modal
// (?q=terms&c=context) it highlights every hit, jumps to the one the result
// pointed at, and shows a small find bar to step through the others.

interface State {
  count: number
  index: number
  label: string
}

const NAVIGATE_EVENT = 'search:navigate'

export default function SearchHighlighter() {
  const [state, setState] = useState<State | null>(null)
  const hl = useRef<Highlighter | null>(null)
  const interacted = useRef(false)

  const scrollTo = useCallback((i: number, instant = false) => {
    const h = hl.current
    if (!h) return
    const rect = h.rectOf(i)
    if (rect.width === 0 && rect.height === 0) return // hidden (e.g. inside a closed <details>)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const top = window.scrollY + rect.top - Math.max(150, window.innerHeight * 0.38)
    window.scrollTo({ top: Math.max(0, top), behavior: reduce || instant ? 'auto' : 'smooth' })
  }, [])

  const go = useCallback(
    (i: number) => {
      const h = hl.current
      if (!h) return
      h.setActive(i)
      scrollTo(i)
      setState((s) => (s ? { ...s, index: i } : s))
    },
    [scrollTo]
  )

  const clear = useCallback(() => {
    hl.current?.clear()
    hl.current = null
    setState(null)
  }, [])

  const run = useCallback(() => {
    clear()
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const root = document.querySelector('[data-search-root]')
    if (!q || !root) return

    const terms = parseQuery(q)
    const { text, segs } = collectText(root)
    const matches = findMatches(text, segs, terms)
    if (matches.length === 0) return

    const start = pickMatch(text, matches, params.get('c') || '')
    hl.current = applyHighlights(matches)
    hl.current.setActive(start)
    setState({ count: matches.length, index: start, label: terms.join(' ') })

    // Land on the hit once layout has settled, and again after images load
    // (they can push the text down) unless the reader has already scrolled.
    interacted.current = false
    requestAnimationFrame(() => scrollTo(start, true))
    const onLoad = () => {
      if (!interacted.current) scrollTo(start, true)
    }
    window.addEventListener('load', onLoad, { once: true })
    const t = window.setTimeout(onLoad, 700)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('load', onLoad)
    }
  }, [clear, scrollTo])

  useEffect(() => {
    let cleanup = run()
    const onNav = () => {
      cleanup?.()
      cleanup = run()
    }
    const mark = () => (interacted.current = true)
    window.addEventListener(NAVIGATE_EVENT, onNav)
    window.addEventListener('wheel', mark, { passive: true })
    window.addEventListener('touchmove', mark, { passive: true })
    window.addEventListener('keydown', mark)
    return () => {
      cleanup?.()
      window.removeEventListener(NAVIGATE_EVENT, onNav)
      window.removeEventListener('wheel', mark)
      window.removeEventListener('touchmove', mark)
      window.removeEventListener('keydown', mark)
      hl.current?.clear()
      hl.current = null
    }
  }, [run])

  const close = useCallback(() => {
    clear()
    const url = new URL(window.location.href)
    url.searchParams.delete('q')
    url.searchParams.delete('c')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
  }, [clear])

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, close])

  if (!state) return null

  const step = (d: number) => go((state.index + d + state.count) % state.count)
  const btn =
    'flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 transition-colors hover:border-red-500/60 hover:text-red-600 dark:border-gray-700 dark:text-gray-400 dark:hover:text-red-400'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-40 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 sm:w-auto"
    >
      <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white/95 px-3 py-2 font-mono text-sm shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <span className="min-w-0 flex-1 truncate sm:max-w-[16rem] sm:flex-none">
          <span className="mr-2 font-bold text-red-600 dark:text-red-500">$</span>
          <span className="text-gray-500 dark:text-gray-400">grep </span>
          <span className="text-gray-900 dark:text-gray-100">{state.label}</span>
        </span>
        <span className="shrink-0 text-gray-500 tabular-nums">
          {state.index + 1}/{state.count}
        </span>
        <button type="button" onClick={() => step(-1)} aria-label="Previous match" className={btn}>
          ‹
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next match" className={btn}>
          ›
        </button>
        <button type="button" onClick={close} aria-label="Clear highlights" className={btn}>
          ✕
        </button>
      </div>
    </div>
  )
}
