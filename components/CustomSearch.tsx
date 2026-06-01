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
      <mark key={i} className="bg-red-500/20 text-red-400 rounded px-0.5">
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-24 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden"
        style={{
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '8px',
          fontFamily: 'var(--font-mono)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div style={{
          background: '#161b22',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #30363d',
        }}>
          <div style={{width:'12px',height:'12px',borderRadius:'50%',background:'#ff5f56'}}></div>
          <div style={{width:'12px',height:'12px',borderRadius:'50%',background:'#ffbd2e'}}></div>
          <div style={{width:'12px',height:'12px',borderRadius:'50%',background:'#27c93f'}}></div>
          <span style={{color:'#8b949e',fontSize:'12px',flex:1,textAlign:'center'}}>b3ta-blocker@archive — search</span>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderBottom: '1px solid #30363d',
        }}>
          <span style={{color:'#e53e3e',fontSize:'13px'}}>$</span>
          <span style={{color:'#8b949e',fontSize:'13px'}}>grep -r</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search articles, tags..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#c9d1d9',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              caretColor: '#e53e3e',
            }}
          />
          <kbd style={{
            fontSize: '10px',
            color: '#8b949e',
            border: '1px solid #30363d',
            borderRadius: '4px',
            padding: '2px 6px',
            fontFamily: 'var(--font-mono)',
          }}>ESC</kbd>
        </div>

        {/* Label */}
        {!query && results.length > 0 && (
          <div style={{padding:'10px 16px 4px'}}>
            <p style={{fontSize:'10px',color:'#8b949e',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>
              # recent articles
            </p>
          </div>
        )}
        {query && results.length > 0 && (
          <div style={{padding:'10px 16px 4px'}}>
            <p style={{fontSize:'10px',color:'#8b949e',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>
              # {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ul style={{maxHeight:'26rem',overflowY:'auto'}}>
            {results.map((doc, idx) => (
              <li key={doc.path} style={{borderTop: idx !== 0 ? '1px solid #21262d' : 'none'}}>
                <Link
                  href={`/${doc.path}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-white/5"
                >
                  {/* Image */}
                  {doc.images?.[0] ? (
                    <div style={{position:'relative',height:'48px',width:'48px',flexShrink:0,overflow:'hidden',borderRadius:'6px',border:'1px solid #30363d'}}>
                      <Image src={doc.images[0]} alt={doc.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div style={{height:'48px',width:'48px',flexShrink:0,borderRadius:'6px',border:'1px solid #30363d',background:'#161b22',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{color:'#8b949e',fontSize:'18px'}}>{'>'}</span>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'13px',fontWeight:600,color:'#c9d1d9',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {highlight(doc.title, query)}
                    </p>
                    <p style={{fontSize:'11px',color:'#8b949e',marginBottom:'4px',fontFamily:'var(--font-mono)'}}>
                      {formatDate(doc.date, siteMetadata.locale)}
                    </p>
                    {doc.tags && doc.tags.length > 0 && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                        {doc.tags.slice(0,4).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(229,62,62,0.08)',
                              border: '1px solid rgba(229,62,62,0.2)',
                              color: '#e53e3e',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {highlight(tag, query)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <span style={{color:'#e53e3e',fontSize:'13px',flexShrink:0}}>→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* No results */}
        {query && results.length === 0 && (
          <div style={{padding:'48px 16px',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'#8b949e',fontFamily:'var(--font-mono)'}}>
              <span style={{color:'#e53e3e'}}>$</span> grep: no matches for <span style={{color:'#c9d1d9'}}>"{query}"</span>
            </p>
            <p style={{fontSize:'11px',color:'#8b949e',marginTop:'4px'}}>try a different title, tag, or topic</p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #30363d',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: '#161b22',
        }}>
          <span style={{fontSize:'10px',color:'#8b949e',fontFamily:'var(--font-mono)'}}>
            press <kbd style={{border:'1px solid #30363d',borderRadius:'3px',padding:'1px 4px'}}>ESC</kbd> to close
          </span>
          <span style={{fontSize:'10px',color:'#8b949e',fontFamily:'var(--font-mono)'}}>
            press <kbd style={{border:'1px solid #30363d',borderRadius:'3px',padding:'1px 4px'}}>↵</kbd> to open
          </span>
          <span style={{fontSize:'10px',color:'#8b949e',fontFamily:'var(--font-mono)',marginLeft:'auto'}}>
            <kbd style={{border:'1px solid #30363d',borderRadius:'3px',padding:'1px 4px'}}>⌘K</kbd> to search
          </span>
        </div>
      </div>
    </div>
  )
}
