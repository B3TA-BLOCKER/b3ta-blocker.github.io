'use client'

import { useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useSetGlow } from '@/components/GlowScope'
import { ICON_GLOW_CLASS } from '@/lib/difficulty'
import { sampleEdgeGlow } from '@/lib/iconColor'

// A post's icon in the home / blog lists. On hover (or keyboard focus) its
// outline glows in the colour of the icon's own edge — read from the image
// itself once it has loaded — so a lime-ringed HTB icon glows lime, a dark
// monochrome photo glows soft silver, and so on. Must be inside a <GlowScope>
// (which holds the colour, so the post's title can glow the same one) and inside
// a link with the `group` class so keyboard focus lights it up too.

const ROUNDED = { xl: 'rounded-xl', full: 'rounded-full' } as const

interface Props {
  src?: string
  alt: string
  locked?: boolean
  /** Size classes for the icon box, e.g. "h-36 w-36". */
  size: string
  shape: keyof typeof ROUNDED
  /** Size class for the 🔒 shown on locked posts. */
  lockTextClass?: string
  /** Rendered instead of the image when the post has none. */
  fallback?: ReactNode
}

export default function PostIcon({
  src,
  alt,
  locked,
  size,
  shape,
  lockTextClass = 'text-sm',
  fallback,
}: Props) {
  const setGlow = useSetGlow()
  const sampled = useRef(false)
  const rounded = ROUNDED[shape]

  const measure = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || sampled.current || !img.complete || img.naturalWidth === 0) return
      sampled.current = true
      const colors = sampleEdgeGlow(img)
      if (colors) setGlow(colors)
    },
    [setGlow]
  )

  return (
    <div className={`${rounded} ${ICON_GLOW_CLASS}`}>
      <div className={`relative ${size} overflow-hidden ${rounded}`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            ref={measure}
            onLoad={(e) => measure(e.currentTarget)}
          />
        ) : (
          fallback
        )}
        {locked && (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/60 ${rounded}`}
          >
            <span className={lockTextClass}>🔒</span>
          </div>
        )}
      </div>
    </div>
  )
}
