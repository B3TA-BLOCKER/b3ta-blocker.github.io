'use client'
import { useState, useRef, useEffect } from 'react'

export default function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)
  const [filename, setFilename] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    // pliny's remarkCodeTitles renders a .remark-code-title div just before our wrapper
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const prev = wrapper.previousElementSibling
    if (prev && prev.classList.contains('remark-code-title')) {
      setFilename(prev.textContent || null)
    }
  }, [])

  const handleCopy = () => {
    const text = preRef.current?.innerText || ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        margin: '1.5rem 0',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono, monospace)',
      }}
      className="code-block-wrapper"
    >
      {/* Title bar */}
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        className="code-block-titlebar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#e53e3e',
            boxShadow: '0 0 6px 2px rgba(229,62,62,0.6)',
            display: 'inline-block',
          }} />
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#d69e2e',
            display: 'inline-block',
            opacity: 0.7,
          }} />
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#38a169',
            display: 'inline-block',
            opacity: 0.7,
          }} />

          {filename && (
            <span className="code-block-path" style={{
              marginLeft: '10px',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}>
              {filename}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            borderRadius: '5px',
            fontSize: '11px',
            fontFamily: 'monospace',
            padding: '2px 10px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
            color: copied ? '#38a169' : undefined,
            borderColor: copied ? '#38a169' : undefined,
          }}
          className="code-block-copy"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* Code area */}
      <div style={{ position: 'relative' }} className="code-block-body">
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          color: '#e53e3e',
          fontFamily: 'monospace',
          fontSize: '12px',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          $
        </div>
        <pre
          ref={preRef}
          {...props}
          style={{
            margin: 0,
            padding: '12px 14px 12px 28px',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.7',
          }}
          className="code-block-pre"
        >
          {children}
        </pre>
      </div>
    </div>
  )
}
