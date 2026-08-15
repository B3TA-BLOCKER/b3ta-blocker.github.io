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

// Matches every heading rendered inside the article body.
const HEADING_SELECTOR = '.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6'

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  // The real ids read straight off the rendered headings, keyed by their
  // position in the document — not the slug string in toc[i].url. The TOC
  // list (post.toc) and the actual article are built by two separate
  // passes of the slugger, and when a heading's text repeats anywhere else
  // in the post (a filename, "Exploit", "Setup") the two passes can number
  // the "-1", "-2" duplicate suffixes differently. Matching by document
  // order instead of by slug string sidesteps that mismatch entirely.
  const [realIds, setRealIds] = useState<string[]>([])
  const items = useMemo(() => toc || [], [toc])

  useEffect(() => {
    if (items.length === 0) return

    const elements = Array.from(document.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
    if (elements.length === 0) return

    setRealIds(elements.map((el) => el.id))

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
  }, [items])

  if (items.length === 0) return null

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
      <ul className="space-y-2.5 border-l border-gray-800 dark:border-gray-700">
        {items.map((item, index) => {
          const isActive = activeIndex === index
          const isTopLevel = item.depth <= 1
          const indent = isTopLevel ? 'pl-4' : item.depth === 2 ? 'pl-7' : 'pl-10'
          const size = isTopLevel ? 'text-base' : 'text-sm'
          // Falls back to the toc-computed slug before the article mounts
          // (SSR / first paint) — replaced by the real rendered id the
          // moment the effect above resolves it.
          const href = realIds[index] ? `#${realIds[index]}` : item.url

          return (
            <li key={item.url} className={`relative ${indent}`}>
              {isActive && (
                <span className="toc-active-bar bg-primary-500 absolute top-0 -left-px h-full w-0.5 rounded-full" />
              )}
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
                {item.value}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
