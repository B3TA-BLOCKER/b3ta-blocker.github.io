'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import NextImage, { ImageProps } from 'next/image'

export default function ImageLightbox(props: ImageProps) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const imgRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setScale(1)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5))
    }

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault()
      setScale(s => {
        const delta = e.deltaY < 0 ? 0.15 : -0.15
        return Math.min(Math.max(s + delta, 0.5), 4)
      })
    }

    window.addEventListener('keydown', handleKey)
    window.addEventListener('wheel', handleScroll, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('wheel', handleScroll)
    }
  }, [open, close])

  return (
    <>
      <NextImage
        {...props}
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in', ...(props.style || {}) }}
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
          {/* Controls */}
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
            <button onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} style={btnStyle} title="Zoom out">−</button>
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '13px', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={() => setScale(s => Math.min(s + 0.25, 4))} style={btnStyle} title="Zoom in">+</button>
            <button onClick={close} style={{ ...btnStyle, fontSize: '22px', marginLeft: '8px' }} title="Close">×</button>
          </div>

          {/* Image */}
          <div
            ref={imgRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: 'default',
              transition: 'transform 0.15s ease',
              transform: `scale(${scale})`,
            }}
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

          {/* Hint */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#8b949e',
            fontFamily: 'monospace',
            fontSize: '11px',
            whiteSpace: 'nowrap',
          }}>
            scroll or +/− to zoom · ESC to close
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
