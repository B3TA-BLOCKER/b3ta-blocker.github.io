'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-primary-500/30 text-primary-400 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function CustomSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchDoc[]>([])
  const [allDocs, setAllDocs] = useState<SearchDoc[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

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
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      const latest = [...allDocs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
      setResults(latest)
      return
    }
    const q = query.toLowerCase()
    const filtered = allDocs.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(q) ||
        doc.summary?.toLowerCase().includes(q) ||
        doc.tags?.some((t) => t.toLowerCase().includes(q))
    )
    setResults(filtered.slice(0, 8))
  }, [query, allDocs])

  if (!isOpen) {
    return (
      <button aria-label="Search" onClick={() => setIsOpen(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="hover:text-primary-500 dark:hover:text-primary-400 h-6 w-6 text-gray-900 dark:text-gray-100"
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-24 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 text-gray-400 shrink-0"
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
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-base"
          />
          <kbd className="text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 font-mono">
            ESC
          </kbd>
        </div>

        {/* Label */}
        {!query && results.length > 0 && (
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent Articles</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[28rem] overflow-y-auto">
            {results.map((doc, idx) => (
              <li key={doc.path}>
                <Link
                  href={`/${doc.path}`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    idx !== results.length - 1
                      ? 'border-b border-gray-100 dark:border-gray-800'
                      : ''
                  }`}
                >
                  {/* Image */}
                  {doc.images?.[0] ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={doc.images[0]}
                        alt={doc.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {highlight(doc.title, query)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-2">
                      {formatDate(doc.date, siteMetadata.locale)}
                    </p>
                    {doc.summary && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                        {highlight(doc.summary, query)}
                      </p>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          >
                            {highlight(tag, query)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* No results */}
        {query && results.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-400">
              No results for{' '}
              <span className="text-gray-600 dark:text-gray-300 font-medium">"{query}"</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Try searching for a tag, title or topic</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <span className="text-xs text-gray-400">
            Press{' '}
            <kbd className="font-mono border border-gray-200 dark:border-gray-700 rounded px-1">
              ESC
            </kbd>{' '}
            to close
          </span>
          <span className="text-xs text-gray-400">
            Press{' '}
            <kbd className="font-mono border border-gray-200 dark:border-gray-700 rounded px-1">
              ↵
            </kbd>{' '}
            to open
          </span>
        </div>
      </div>
    </div>
  )
}
