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

// Distance (px) from the top of the viewport that counts as the "active
// line". Used for both scrollspy detection and the click-to-scroll offset,
// so the heading that lights up is always the same one you scrolled to.
// Kept in sync with the `.prose h1..h6 { scroll-margin-top }` rule in
// tailwind.css. Used only for scrollspy detection here — the click handler
// below relies on that CSS rule directly via scrollIntoView, so the two can
// never disagree about where "the top" is.
const ACTIVE_LINE = 170

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const items = useMemo(() => toc || [], [toc])

  useEffect(() => {
    if (items.length === 0) return

    const ids = items.map((item) => decodeURIComponent(item.url.replace('#', '')))
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    let ticking = false

    // Walk the headings in document order and keep the last one that has
    // scrolled past the active line. If none have (we're above the first
    // heading, e.g. right after landing back at the top), nothing is
    // active — the list goes dark instead of freezing on a stale heading.
    const updateActive = () => {
      let current = ''
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= ACTIVE_LINE) {
          current = el.id
        } else {
          break
        }
      }
      setActiveId(current)
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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
    setActiveId(id)
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
        {items.map((item) => {
          const id = decodeURIComponent(item.url.replace('#', ''))
          const isActive = activeId === id
          const isTopLevel = item.depth <= 1
          const indent = isTopLevel ? 'pl-4' : item.depth === 2 ? 'pl-7' : 'pl-10'
          const size = isTopLevel ? 'text-base' : 'text-sm'

          return (
            <li key={item.url} className={`relative ${indent}`}>
              {isActive && (
                <span className="toc-active-bar bg-primary-500 absolute top-0 -left-px h-full w-0.5 rounded-full" />
              )}
              <a
                href={item.url}
                onClick={(e) => handleClick(e, id)}
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
