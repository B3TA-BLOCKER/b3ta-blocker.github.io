'use client'
import { useState, useRef } from 'react'

export default function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const handleCopy = () => {
    const text = preRef.current?.innerText || ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      margin: '1.5rem 0',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #21262d',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      fontFamily: 'var(--font-mono, monospace)',
    }}>
      {/* Title bar */}
      <div style={{
        background: '#161b22',
        borderBottom: '1px solid #21262d',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
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
          <span style={{
            marginLeft: '10px',
            color: '#484f58',
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}>
            ~/b3ta-blocker
          </span>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: '1px solid #30363d',
            borderRadius: '5px',
            color: copied ? '#38a169' : '#8b949e',
            fontSize: '11px',
            fontFamily: 'monospace',
            padding: '2px 10px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* Code area */}
      <div style={{ background: '#0d1117', position: 'relative' }}>
        {/* Prompt indicator line */}
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
            overflowX: 'auto',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#c9d1d9',
          }}
        >
          {children}
        </pre>
      </div>
    </div>
  )
}
