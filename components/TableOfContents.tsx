'use client'

import { useEffect, useMemo, useState } from 'react'

interface TocHeading {
  value: string
  url: string
  depth: number
}

interface TableOfContentsProps {
  toc: TocHeading[]
}

// Kept in sync with the `.prose h1..h6 { scroll-margin-top }` rule in
// tailwind.css — the click handler relies on that CSS rule via
// scrollIntoView, so the two can never disagree about where "the top" is.
const ACTIVE_LINE = 170

// Matches every heading actually rendered inside the article body.
const HEADING_SELECTOR = '.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6'

// Tree-line layout constants (all in px). BASE is the gap between the
// active-indicator bar and the first connector column; LEVEL_WIDTH is the
// horizontal distance between one depth level's connector column and the
// next, mirroring the indentation step of `tree`'s output.
const BASE = 6
const LEVEL_WIDTH = 16
const MAX_LEVEL = 4
const LINE_CLASS = 'bg-gray-800 dark:bg-gray-700'

interface HeadingEntry {
  value: string
  id: string
  depth: number
}

interface TreeRow extends HeadingEntry {
  level: number
  isLast: boolean
  // ancestorContinues[k] is true when the ancestor at depth k has more
  // siblings below it — i.e. its vertical line has to keep running past
  // this row instead of stopping.
  ancestorContinues: boolean[]
}

// Turns the flat, depth-only heading list into per-row tree metadata: how
// deep it sits, whether it's the last child at its level, and which of its
// ancestors' vertical lines need to keep running past this row. Headings
// are already in document order, so "next sibling" / "last child" can be
// read straight off the surrounding depths — no need to build an actual
// nested tree first.
function computeTreeRows(list: HeadingEntry[]): TreeRow[] {
  const n = list.length
  if (n === 0) return []

  const minDepth = Math.min(...list.map((item) => item.depth))
  const levels = list.map((item) => Math.min(item.depth - minDepth, MAX_LEVEL))

  const isLast = levels.map((level, i) => {
    for (let j = i + 1; j < n; j++) {
      if (levels[j] === level) return false
      if (levels[j] < level) return true
    }
    return true
  })

  const ancestorContinuesFor = (i: number, level: number): boolean[] => {
    const result: boolean[] = []
    for (let k = 0; k < level; k++) {
      let continues = false
      for (let j = i - 1; j >= 0; j--) {
        if (levels[j] === k) {
          continues = !isLast[j]
          break
        }
        if (levels[j] < k) break
      }
      result.push(continues)
    }
    return result
  }

  return list.map((item, i) => ({
    ...item,
    level: levels[i],
    isLast: isLast[i],
    ancestorContinues: ancestorContinuesFor(i, levels[i]),
  }))
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  // `post.toc` is computed server-side by a separate, minimal markdown
  // parse (no MDX components, no GFM, none of the other remark/rehype
  // plugins the real article pipeline uses) — so it's only used here as a
  // placeholder for the very first paint, before this effect runs.
  const fallback = useMemo(() => toc || [], [toc])

  // The real list, read straight off the rendered headings once the
  // article mounts. This is the single source of truth for both what's
  // shown here and what the scrollspy below tracks, so the two — and the
  // clicked heading — can never point at different things.
  const [items, setItems] = useState<HeadingEntry[] | null>(null)

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
    if (elements.length === 0) return

    setItems(
      elements.map((el) => ({
        value: el.textContent || '',
        id: el.id,
        depth: Number(el.tagName.slice(1)) || 1,
      }))
    )

    let ticking = false

    // Walk the headings in document order and keep the last one that has
    // scrolled past the active line. If none have (we're above the first
    // heading, e.g. right after landing back at the top), nothing is
    // active — the list goes dark instead of freezing on a stale heading.
    const updateActive = () => {
      let current = -1
      elements.forEach((el, index) => {
        if (el.getBoundingClientRect().top <= ACTIVE_LINE) {
          current = index
        }
      })
      setActiveIndex(current)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(updateActive)
      }
    }

    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [fallback])

  const list: HeadingEntry[] =
    items ?? fallback.map((item) => ({ value: item.value, id: '', depth: item.depth }))

  const rows = useMemo(() => computeTreeRows(list), [list])

  if (rows.length === 0) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    e.preventDefault()
    const el = document.querySelectorAll<HTMLElement>(HEADING_SELECTOR)[index]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (el.id) window.history.replaceState(null, '', `#${el.id}`)
    setActiveIndex(index)
  }

  return (
    <nav
      className="toc-nav no-scrollbar max-h-[calc(100vh-9rem)] overflow-y-auto pr-2"
      aria-label="Table of contents"
    >
      <h2 className="mb-4 font-mono text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
        <span className="text-primary-500">{'//'}</span> On this page
      </h2>
      <ul className="space-y-2.5">
        {rows.map((row, index) => {
          const isActive = activeIndex === index
          const isTopLevel = row.level === 0
          const size = isTopLevel ? 'text-base' : 'text-sm'
          const href = row.id ? `#${row.id}` : '#'

          const ownColumn = BASE + row.level * LEVEL_WIDTH + LEVEL_WIDTH / 2
          const contentPadding = BASE + (row.level + 1) * LEVEL_WIDTH + 6

          return (
            <li
              key={`${index}-${row.value}`}
              className="relative"
              style={{ paddingLeft: contentPadding }}
            >
              {isActive && (
                <span className="toc-active-bar bg-primary-500 absolute top-0 -left-px h-full w-0.5 rounded-full" />
              )}

              {/* Ancestor trunk lines — keep running past this row for any
                  ancestor that still has more siblings coming below it. */}
              {row.ancestorContinues.map((continues, k) =>
                continues ? (
                  <span
                    key={k}
                    className={`absolute top-0 h-full w-px ${LINE_CLASS}`}
                    style={{ left: BASE + k * LEVEL_WIDTH + LEVEL_WIDTH / 2 }}
                  />
                ) : null
              )}

              {/* This row's own corner: a full-height "├" if more siblings
                  follow at this level, or a half-height "└" elbow if it's
                  the last one — then the horizontal stub into the label. */}
              <span
                className={`absolute w-px ${LINE_CLASS}`}
                style={{
                  left: ownColumn,
                  top: 0,
                  height: row.isLast ? '50%' : '100%',
                }}
              />
              <span
                className={`absolute h-px ${LINE_CLASS}`}
                style={{
                  left: ownColumn,
                  top: '50%',
                  width: LEVEL_WIDTH / 2 + 6,
                }}
              />

              <a
                href={href}
                onClick={(e) => handleClick(e, index)}
                className={`toc-link block leading-6 transition-all duration-200 ${size} ${
                  isActive
                    ? `toc-glow text-primary-400 ${isTopLevel ? 'font-semibold' : 'font-medium'}`
                    : `text-gray-500 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-300 ${
                        isTopLevel ? 'opacity-90 hover:opacity-100' : 'opacity-70 hover:opacity-100'
                      }`
                }`}
              >
                {row.value}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
