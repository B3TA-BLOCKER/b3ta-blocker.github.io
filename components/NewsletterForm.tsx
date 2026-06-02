'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
        setMessage("You're subscribed! You'll get notified on new posts.")
        setEmail('')
      } else {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div
      style={{
        borderTop: '1px solid #21262d',
        paddingTop: '2rem',
        marginTop: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#e53e3e',
          marginBottom: '0.5rem',
        }}>
          Newsletter
        </p>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: '0.25rem',
        }}>
          Get notified on new posts
        </h3>
        <p style={{
          fontSize: '13px',
          color: '#8b949e',
        }}>
          No spam. Just writeups, walkthroughs, and notes — straight to your inbox.
        </p>
      </div>

      {status === 'success' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: '#48bb78',
        }}>
          <span>✓</span>
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '480px', width: '100%' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              flex: 1,
              minWidth: '200px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '8px 14px',
              color: '#c9d1d9',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              background: 'transparent',
              border: '1px solid #e53e3e',
              borderRadius: '6px',
              padding: '8px 20px',
              color: '#e53e3e',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.6 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe →'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#f97583',
          fontFamily: 'var(--font-mono)',
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
