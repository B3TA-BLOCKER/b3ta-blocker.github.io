'use client'

import { useEffect, useRef, useState } from 'react'
import type { Font } from 'opentype.js'

// Self-hosted so the intro doesn't depend on a third party being up, and so
// it respects this site's `font-src 'self'` CSP. See public/static/fonts/.
const FONT_URL = `${process.env.BASE_PATH || ''}/static/fonts/Satisfy-Regular.ttf`

// Module-level cache so the font is only fetched + parsed once even if this
// component mounts more than once in a session (e.g. fast client nav).
let fontPromise: Promise<Font> | null = null
function loadFont(): Promise<Font> {
  if (!fontPromise) {
    fontPromise = import('opentype.js').then(
      (mod) =>
        new Promise<Font>((resolve, reject) => {
          const opentype = mod.default ?? mod
          opentype.load(FONT_URL, (err: Error | null, font?: Font) =>
            err || !font ? reject(err ?? new Error('font failed to parse')) : resolve(font)
          )
        })
    )
  }
  return fontPromise
}

type Props = {
  text: string
  fontSize?: number
  /** Skip the animation and render plain static text — used for repeat visits in the same session. */
  skip?: boolean
  onDone?: () => void
  className?: string
}

/**
 * Draws `text` the way a hand actually would: it traces the real vector
 * outlines of the Satisfy font glyph-by-glyph (stroke-dashoffset driven by
 * requestAnimationFrame against each glyph's own path length), with a
 * glowing pen tip that rides the live path coordinate — so it follows every
 * loop and crossbar, not just a left-to-right wipe. Ink fills in right
 * behind the traced outline.
 *
 * Renders as plain static text (matching the server-rendered fallback) when
 * `skip` is true or if the font fails to load for any reason.
 */
export default function HandwrittenText({
  text,
  fontSize = 26,
  skip = false,
  onDone,
  className = '',
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [mode, setMode] = useState<'static' | 'animating' | 'failed'>('static')
  const fontRef = useRef<Font | null>(null)
  const startedRef = useRef(false)

  // Phase 1: load + parse the font (network/CPU work, no DOM needed yet).
  useEffect(() => {
    if (skip || startedRef.current) {
      if (skip) onDone?.()
      return
    }
    startedRef.current = true
    let cancelled = false

    loadFont()
      .then((font) => {
        if (cancelled) return
        fontRef.current = font
        setMode('animating') // mounts the <svg>; phase 2 picks up once it's in the DOM
      })
      .catch(() => {
        if (!cancelled) {
          setMode('failed')
          onDone?.()
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip])

  // Phase 2: the <svg> is now in the DOM (mode === 'animating') — build the
  // glyph paths and run the live trace.
  useEffect(() => {
    if (mode !== 'animating' || !fontRef.current || !svgRef.current) return
    const font = fontRef.current
    const svg = svgRef.current
    let rafId = 0
    let cancelled = false

    try {
      const scale = fontSize / font.unitsPerEm
      let x = 0
      const y = fontSize * 0.78
      const glyphData: { d: string; x: number }[] = []

      for (const ch of text) {
        const glyph = font.charToGlyph(ch === ' ' ? ' ' : ch)
        if (ch !== ' ') {
          const path = glyph.getPath(x, y, fontSize)
          glyphData.push({ d: path.toPathData(2), x })
        }
        x += (glyph.advanceWidth ?? 0) * scale + (ch === ' ' ? fontSize * 0.28 : 0)
      }

      svg.setAttribute('viewBox', `0 0 ${x + 6} ${fontSize * 1.3}`)
      svg.setAttribute('width', String(x))

      const totalDuration = Math.min(2600, Math.max(1400, text.length * 95))
      const segs = glyphData.map((g) => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        p.setAttribute('d', g.d)
        p.setAttribute('fill', 'currentColor')
        p.setAttribute('fill-opacity', '0')
        p.setAttribute('stroke', 'currentColor')
        p.setAttribute('stroke-width', '1.3')
        p.setAttribute('stroke-linecap', 'round')
        p.setAttribute('stroke-linejoin', 'round')
        svg.appendChild(p)
        return { el: p, gx: g.x }
      })

      const lens = segs.map((s) => s.el.getTotalLength())
      const totalLen = lens.reduce((a, b) => a + b, 0) || 1
      let t = 0
      const timeline = segs.map((s, i) => {
        const dur = Math.max(80, (lens[i] / totalLen) * totalDuration * 0.82)
        const start = t
        t += dur * 0.62 // slight overlap — a hand doesn't fully stop between letters
        s.el.style.strokeDasharray = String(lens[i])
        s.el.style.strokeDashoffset = String(lens[i])
        return { el: s.el, len: lens[i], start, dur, fillDur: 180 }
      })
      const animEnd = Math.max(...timeline.map((seg) => seg.start + seg.dur)) + 250

      const pen = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      pen.setAttribute('r', '2.2')
      pen.setAttribute('fill', 'currentColor')
      pen.style.opacity = '0'
      pen.style.filter = 'drop-shadow(0 0 4px currentColor)'
      svg.appendChild(pen)

      let startTs: number | null = null
      const frame = (now: number) => {
        if (cancelled) return
        if (startTs === null) startTs = now
        const elapsed = now - startTs
        let activePoint: { x: number; y: number } | null = null

        for (const seg of timeline) {
          const segT = elapsed - seg.start
          if (segT <= 0) continue
          if (segT < seg.dur) {
            const p = Math.min(1, segT / seg.dur)
            seg.el.style.strokeDashoffset = String(seg.len * (1 - p))
            activePoint = seg.el.getPointAtLength(seg.len * p)
          } else {
            seg.el.style.strokeDashoffset = '0'
            const fillT = Math.min(1, (segT - seg.dur) / seg.fillDur)
            seg.el.style.fillOpacity = String(fillT)
            if (segT - seg.dur < seg.fillDur) activePoint = seg.el.getPointAtLength(seg.len)
          }
        }

        if (activePoint) {
          pen.setAttribute('cx', String(activePoint.x))
          pen.setAttribute('cy', String(activePoint.y))
          pen.style.opacity = '1'
        } else if (elapsed < (timeline[0]?.start ?? 0)) {
          pen.style.opacity = '0'
        }

        if (elapsed < animEnd) {
          rafId = requestAnimationFrame(frame)
        } else {
          pen.style.opacity = '0'
          onDone?.()
        }
      }
      rafId = requestAnimationFrame(frame)
    } catch {
      if (!cancelled) {
        setMode('failed')
        onDone?.()
      }
    }

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  if (mode !== 'animating') {
    return (
      <span className={`font-cursive ${className}`} aria-label={text}>
        {text}
      </span>
    )
  }

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ height: fontSize * 1.3, overflow: 'visible' }}
      aria-label={text}
      role="img"
    />
  )
}
