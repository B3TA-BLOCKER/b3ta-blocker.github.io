'use client'

import { useState, useEffect, useCallback } from 'react'
import NextImage, { ImageProps } from 'next/image'

export default function ImageLightbox(props: ImageProps) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)

  const close = useCallback(() => {
    setOpen(false)
    setScale(1)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') close()
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <>
      <NextImage
        {...props}
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in' }}
      />

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          {/* Top controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <button
              onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
              style={btnStyle}
              title="Zoom out"
            >
              −
            </button>
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '13px', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(s + 0.25, 4))}
              style={btnStyle}
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={close}
              style={{ ...btnStyle, fontSize: '22px', marginLeft: '8px' }}
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'default', transition: 'transform 0.2s', transform: `scale(${scale})` }}
          >
            <img
              src={props.src as string}
              alt={props.alt || ''}
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '6px',
              }}
            />
          </div>

          {/* Bottom hint */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#8b949e',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}>
            scroll or +/- to zoom · ESC to close
          </div>
        </div>
      )}
    </>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  width: '32px',
  height: '32px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
