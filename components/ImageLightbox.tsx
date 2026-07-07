'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import NextImage, { ImageProps } from 'next/image'

export default function ImageLightbox(props: ImageProps) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLImageElement>(null)

  // Drag tracking (kept in a ref so the listeners always see fresh values
  // without having to re-bind on every render)
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
  })

  const close = useCallback(() => {
    setOpen(false)
    setScale(1)
    setPos({ x: 0, y: 0 })
  }, [])

  // Keep the pan position inside sensible bounds so the image can't be
  // dragged completely out of view.
  const clampPos = useCallback((x: number, y: number, s: number) => {
    const el = contentRef.current
    if (!el) return { x, y }

    const rect = el.getBoundingClientRect()
    // rect already reflects the current transform, so divide out scale
    // to get the image's natural (unscaled) displayed size.
    const baseWidth = rect.width / s
    const baseHeight = rect.height / s

    const maxX = Math.max(0, (baseWidth * s - baseWidth) / 2)
    const maxY = Math.max(0, (baseHeight * s - baseHeight) / 2)

    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    }
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
    setPos({ x: 0, y: 0 })
  }, [])

  const zoomBy = useCallback((delta: number) => {
    setScale(s => {
      const next = Math.min(Math.max(s + delta, 0.5), 4)
      // If we zoomed back out to 1 (or below), recenter.
      if (next <= 1) setPos({ x: 0, y: 0 })
      else setPos(p => clampPos(p.x, p.y, next))
      return next
    })
  }, [clampPos])

  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === '+' || e.key === '=') zoomBy(0.25)
      if (e.key === '-') zoomBy(-0.25)
    }

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      zoomBy(delta)
    }

    // Pointer events cover mouse, touch, and pen with one code path.
    const handlePointerDown = (e: PointerEvent) => {
      if (scale <= 1) return // nothing to pan when not zoomed in
      drag.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: pos.x,
        startPosY: pos.y,
      }
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!drag.current.active) return
      e.preventDefault()
      const dx = e.clientX - drag.current.startX
      const dy = e.clientY - drag.current.startY
      const next = clampPos(drag.current.startPosX + dx, drag.current.startPosY + dy, scale)
      setPos(next)
    }

    const handlePointerUp = () => {
      drag.current.active = false
    }

    // Double-click / double-tap to reset zoom & pan
    const handleDoubleClick = () => resetZoom()

    window.addEventListener('keydown', handleKey)
    window.addEventListener('wheel', handleScroll, { passive: false })

    const contentEl = contentRef.current
    contentEl?.addEventListener('pointerdown', handlePointerDown)
    contentEl?.addEventListener('dblclick', handleDoubleClick)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('wheel', handleScroll)
      contentEl?.removeEventListener('pointerdown', handlePointerDown)
      contentEl?.removeEventListener('dblclick', handleDoubleClick)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [open, close, scale, pos, zoomBy, clampPos, resetZoom])

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
            <button onClick={() => zoomBy(-0.25)} style={btnStyle} title="Zoom out">−</button>
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '13px', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button onClick={() => zoomBy(0.25)} style={btnStyle} title="Zoom in">+</button>
            <button onClick={close} style={{ ...btnStyle, fontSize: '22px', marginLeft: '8px' }} title="Close">×</button>
          </div>

          {/* Image */}
          <div
            ref={imgRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: scale > 1 ? 'grab' : 'default',
              touchAction: 'none', // let us handle pan gestures ourselves
              transition: drag.current.active ? 'none' : 'transform 0.15s ease',
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            }}
          >
            <img
              ref={contentRef}
              src={props.src as string}
              alt={props.alt || ''}
              draggable={false}
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '6px',
                userSelect: 'none',
                pointerEvents: 'auto',
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
            scroll or +/− to zoom · drag to pan · double-click to reset · ESC to close
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
