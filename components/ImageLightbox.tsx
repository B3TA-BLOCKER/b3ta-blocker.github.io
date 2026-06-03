'use client'

import { useState } from 'react'
import NextImage, { ImageProps } from 'next/image'

export default function ImageLightbox(props: ImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <NextImage
        {...props}
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in' }}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
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
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.5rem',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '28px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Full size image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              cursor: 'default',
            }}
          >
            <img
              src={props.src as string}
              alt={props.alt || ''}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '6px',
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
