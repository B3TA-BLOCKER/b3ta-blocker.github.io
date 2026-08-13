'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface TocHeading {
  value: string
  url: string
  depth: number
}

interface TableOfContentsProps {
  toc: TocHeading[]
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  // toc[0] is almost always the post's H1, which is already shown as the
  // page title above — skip it so the list only holds real sections.
  const items = useMemo(() => (toc && toc.length > 1 ? toc.slice(1) : []), [toc])

  useEffect(() => {
    if (items.length === 0) return

    const ids = items.map((item) => decodeURIComponent(item.url.replace('#', '')))
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) {
          // Topmost heading currently in the "active band" wins.
          setActiveId(visible[0].target.id)
        }
      },
      {
        // Counts a heading "active" once it crosses ~96px from the top and
        // until it's 70% of the way up the viewport — keeps one section lit
        // at a time instead of flickering between neighbours.
        rootMargin: '-96px 0px -70% 0px',
        threshold: 0,
      }
    )

    elements.forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [items])

  if (items.length === 0) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const offset = 88
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
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
