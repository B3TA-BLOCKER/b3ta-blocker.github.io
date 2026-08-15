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

interface HeadingEntry {
  value: string
  id: string
  depth: number
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

  if (list.length === 0) return null

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
        {list.map((item, index) => {
          const isActive = activeIndex === index
          const isTopLevel = item.depth <= 1
          const indent = isTopLevel ? 'pl-4' : item.depth === 2 ? 'pl-7' : 'pl-10'
          const size = isTopLevel ? 'text-base' : 'text-sm'
          const href = item.id ? `#${item.id}` : '#'

          return (
            <li key={`${index}-${item.value}`} className={`relative ${indent}`}>
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
