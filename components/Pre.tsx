'use client'
import { useState, useRef } from 'react'

export default function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // Extract filename from code block meta (e.g. ```python:malicious.py)
  const getFilename = () => {
    const child = (children as any)
    const className: string = child?.props?.className || ''
    // Try to get filename from language:filename syntax
    const match = className.match(/language-[^:]+:(.+)/)
    if (match) return match[1]
    return null
  }

  const filename = getFilename()

  const handleCopy = () => {
    const text = preRef.current?.innerText || ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
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
        {/* Traffic lights */}
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

          {/* Show filename if set, otherwise nothing */}
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

        {/* Copy button */}
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