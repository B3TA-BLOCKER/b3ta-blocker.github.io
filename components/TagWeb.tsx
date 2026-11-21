'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { slug } from 'github-slugger'
import {
  CORE_R,
  HEX_R,
  K_MAX,
  K_MIN,
  clampView,
  focusOn,
  layoutWeb,
  wrapTag,
  zoomAbout,
  type View,
} from '@/lib/tagWeb'

type Heat = 'hot' | 'warm' | 'cool'

interface Props {
  sections: { label: string; tags: string[] }[]
  counts: Record<string, number>
  heatOf: (count: number) => Heat
  /** Text for the INFO legend, e.g. { hot: '5+ posts', ... } */
  ranges: Record<Heat, string>
  /** Drawn over the top-left corner of the map (the page title). The packer keeps that corner free. */
  children?: ReactNode
  title?: string
}

const r1 = (n: number) => Math.round(n * 10) / 10

// --- shapes ----------------------------------------------------------------
const S3 = 0.866025 // sqrt(3) / 2, written out so server and browser agree to the last digit
const hexPoints = (r: number) =>
  [
    [0, -r],
    [S3 * r, -r / 2],
    [S3 * r, r / 2],
    [0, r],
    [-S3 * r, r / 2],
    [-S3 * r, -r / 2],
  ]
    .map(([x, y]) => `${r1(x)},${r1(y)}`)
    .join(' ')

const TILE = hexPoints(HEX_R - 3.2) // a little smaller than the tile so neighbours leave a gap

// --- look ------------------------------------------------------------------
// Plain classes (no CSS variables), keyed off the site's `.dark` class.
// One neutral tile colour; heat is carried by the accent: cool = quiet slate,
// warm = amber, hot = red with a glow.
const CSS = `
.tw-ink{fill:#0f172a}.tw-mute{fill:#64748b}.tw-bg{fill:#ffffff}
.dark .tw-ink{fill:#e2e8f0}.dark .tw-mute{fill:#94a3b8}.dark .tw-bg{fill:#030712}

.tw-poly{fill:#94a3b8;fill-opacity:.09;stroke:#64748b;stroke-opacity:.5;stroke-width:1.4;transition:fill-opacity .15s,stroke-opacity .15s,stroke-width .15s}
.tw-lbl{fill:#475569;font-weight:600}
.dark .tw-lbl{fill:#aab6c9}
.tw-warm .tw-poly{fill:#f59e0b;fill-opacity:.16;stroke:#f59e0b;stroke-opacity:.7}
.tw-warm .tw-lbl{fill:#92400e}
.dark .tw-warm .tw-lbl{fill:#fcd34d}
.tw-hot .tw-poly{fill:#ef4444;fill-opacity:.26;stroke:#ef4444;stroke-opacity:1;filter:url(#tw-glow)}
.tw-hot .tw-lbl{fill:#991b1b}
.dark .tw-hot .tw-lbl{fill:#ffffff}

.tw-hex{cursor:pointer;outline:none;transform-box:fill-box;transform-origin:center;transition:transform .15s ease}
.tw-hex:hover,.tw-hex:focus-visible{transform:scale(1.07)}
.tw-hex:hover .tw-poly,.tw-hex:focus-visible .tw-poly{fill:#ef4444;fill-opacity:.32;stroke:#ef4444;stroke-opacity:1;stroke-width:2.4}
.tw-hex:hover .tw-lbl,.tw-hex:focus-visible .tw-lbl{fill:#7f1d1d}
.dark .tw-hex:hover .tw-lbl,.dark .tw-hex:focus-visible .tw-lbl{fill:#ffffff}

.tw-cat{font-weight:800;letter-spacing:.09em;font-size:20px}
.tw-ul{fill:#ef4444}
.tw-branch{fill:none;stroke:#64748b;stroke-opacity:.62;stroke-width:1.4;stroke-dasharray:4 6;animation:tw-flow 2.4s linear infinite;transition:stroke .2s,stroke-opacity .2s,stroke-width .2s}
.tw-branch.tw-on{stroke:#ef4444;stroke-opacity:.95;stroke-width:2}
.tw-link{fill:none;stroke:#64748b;stroke-opacity:.17;stroke-width:1;stroke-dasharray:2 7}
.tw-core-ring{fill:none;stroke:#ef4444;stroke-opacity:.35;stroke-width:1.5;stroke-dasharray:4 6;transform-box:fill-box;transform-origin:center;animation:tw-pulse 3.2s ease-in-out infinite}

.tw-dim{opacity:.12}
.tw-fade{transition:opacity .2s ease}
.tw-enter{animation:tw-in .45s ease-out var(--d,0ms) both;transform-box:fill-box;transform-origin:center}

@keyframes tw-flow{to{stroke-dashoffset:-18}}
@keyframes tw-pulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.07);opacity:.35}}
@keyframes tw-in{from{opacity:0;transform:scale(.7)}}
@media (prefers-reduced-motion:reduce){.tw-branch,.tw-core-ring,.tw-enter{animation:none}}
`

// --- small pieces ----------------------------------------------------------
const ICON = 'h-[18px] w-[18px]'

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  )
}
function FitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="currentColor" />
      <path
        d="M12 11v5.5"
        className="stroke-white dark:stroke-gray-900"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.6" r="1.4" className="fill-white dark:fill-gray-900" />
    </svg>
  )
}

const PANEL =
  'rounded-xl border border-gray-300 bg-white/85 shadow-lg backdrop-blur-md dark:border-gray-700/70 dark:bg-gray-900/80'
const ICON_BTN =
  'grid h-10 w-10 place-items-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'

/** Gentle arc from (x1,y1) to (x2,y2): the midpoint pushed sideways by `bend` (0.12 = subtle). */
function curve(x1: number, y1: number, x2: number, y2: number, bend: number, outward = false) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  let px = -dy * bend
  let py = dx * bend
  if (outward && px * mx + py * my < 0) {
    px = -px
    py = -py
  }
  return `M${Math.round(x1)},${Math.round(y1)} Q${Math.round(mx + px)},${Math.round(my + py)} ${Math.round(x2)},${Math.round(y2)}`
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// --- the map ---------------------------------------------------------------
export default function TagWeb({
  sections,
  counts,
  heatOf,
  ranges,
  children,
  title = "Bukhari's Archive",
}: Props) {
  const router = useRouter()
  const layout = useMemo(() => layoutWeb(sections), [sections])
  const totalTags = layout.clusters.reduce((n, c) => n + c.tags.length, 0)
  const vb = layout.viewBox
  const [vx, vy, vw, vh] = vb

  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [top, setTop] = useState(120) // where the site header ends; the map fills everything below it
  const [size, setSize] = useState({ w: 1200, h: 600 })
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 })
  const [anim, setAnim] = useState<0 | 1 | 2>(0) // 0 none (dragging), 1 quick (wheel / keys), 2 smooth (buttons / find)
  const [dragging, setDragging] = useState(false)
  const [panel, setPanel] = useState<null | 'find' | 'info'>(null)
  const [query, setQuery] = useState('')
  const [hover, setHover] = useState<{
    tag: string
    n: number
    ci: number
    x: number
    y: number
  } | null>(null)

  const drag = useRef<{
    id: number
    sx: number
    sy: number
    ox: number
    oy: number
    on: boolean
  } | null>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d0: number; k0: number; wx: number; wy: number } | null>(null)
  const swallowClick = useRef(false)
  const findRef = useRef<HTMLInputElement>(null)

  const ring = useMemo(
    () => [...layout.clusters].sort((a, b) => a.slot - b.slot),
    [layout.clusters]
  )

  // Fill the screen below the site header (measured, so it follows the real header height)
  useEffect(() => {
    const header = document.querySelector('header')
    const measure = () =>
      setTop(Math.max(0, Math.round(header?.getBoundingClientRect().bottom ?? 120)))
    measure()
    window.addEventListener('resize', measure)
    const ro = header ? new ResizeObserver(measure) : null
    if (header) ro?.observe(header)
    return () => {
      window.removeEventListener('resize', measure)
      ro?.disconnect()
    }
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // On-screen size of one map unit. Tag names only appear once they would be readable (semantic zoom).
  const fitScale = Math.min(size.w / vw, size.h / vh)
  const px = fitScale * view.k
  const labelOp = Math.round(clamp01((px - 0.5) / 0.28) * 100) / 100

  // --- find: tags (or whole categories) matching the query; everything else dims
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '-')
    if (!q) return null
    const qLabel = query
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const hit = new Set<string>()
    for (const sec of layout.clusters) {
      const labelSlug = sec.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const categoryHit = qLabel !== '' && labelSlug.includes(qLabel)
      for (const t of sec.tags) if (categoryHit || t.includes(q)) hit.add(t)
    }
    return hit
  }, [query, layout.clusters])

  const tiers = useMemo(() => {
    const n: Record<Heat, number> = { hot: 0, warm: 0, cool: 0 }
    layout.clusters.forEach((c) => c.tags.forEach((t) => (n[heatOf(counts[t] ?? 0)] += 1)))
    return n
  }, [layout.clusters, counts, heatOf])

  // --- screen <-> map conversion (the svg is letterboxed when its shape differs from the map's)
  const geom = () => {
    const el = svgRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const s = Math.min(r.width / vw, r.height / vh)
    return { r, s, offX: (r.width - vw * s) / 2, offY: (r.height - vh * s) / 2 }
  }
  const toMap = (cx: number, cy: number) => {
    const g = geom()
    if (!g) return { x: vx + vw / 2, y: vy + vh / 2 }
    return { x: vx + (cx - g.r.left - g.offX) / g.s, y: vy + (cy - g.r.top - g.offY) / g.s }
  }

  // Mouse wheel / trackpad zooms about the pointer (the map owns the screen, so the page doesn't scroll).
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = toMap(e.clientX, e.clientY)
      const speed = e.ctrlKey ? 0.01 : 0.0016 // trackpad pinch arrives as small ctrl+wheel deltas
      setAnim(1)
      setView((v) => zoomAbout(v, Math.exp(-e.deltaY * speed), p.x, p.y, vb))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  const step = (factor: number) => {
    setAnim(2)
    setView((v) => zoomAbout(v, factor, vx + vw / 2, vy + vh / 2, vb))
  }
  const fit = () => {
    setAnim(2)
    setView({ k: 1, x: 0, y: 0 })
  }

  const focusMatches = () => {
    if (!matches || matches.size === 0) return
    let sx = 0
    let sy = 0
    let n = 0
    for (const c of layout.clusters)
      for (const cell of c.cells)
        if (matches.has(cell.tag)) {
          sx += c.x + cell.x
          sy += c.y + cell.y
          n += 1
        }
    setAnim(2)
    setView(focusOn(sx / n, sy / n, n === 1 ? 2.8 : n <= 6 ? 2 : 1.4, vb))
  }

  // Opening FIND puts the cursor straight in the box
  useEffect(() => {
    if (panel === 'find') findRef.current?.focus()
  }, [panel])

  const toggle = (which: 'find' | 'info') => {
    setPanel((p) => {
      const next = p === which ? null : which
      if (next !== 'find') setQuery('')
      return next
    })
  }

  // --- drag to pan, pinch to zoom. The pointer is captured only once the mouse really moves, so plain clicks reach the hexes.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    swallowClick.current = false
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.current.size === 1) {
      drag.current = {
        id: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        ox: view.x,
        oy: view.y,
        on: false,
      }
    } else if (pts.current.size === 2) {
      drag.current = null
      const [a, b] = Array.from(pts.current.values())
      const mid = toMap((a.x + b.x) / 2, (a.y + b.y) / 2)
      pinch.current = {
        d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        k0: view.k,
        wx: (mid.x - view.x) / view.k,
        wy: (mid.y - view.y) / view.k,
      }
      swallowClick.current = true
      setHover(null)
      setAnim(0)
      setDragging(true)
    }
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pts.current.has(e.pointerId)) pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const pn = pinch.current
    if (pn && pts.current.size >= 2) {
      const [a, b] = Array.from(pts.current.values())
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const mid = toMap((a.x + b.x) / 2, (a.y + b.y) / 2)
      const k = Math.min(K_MAX, Math.max(K_MIN, pn.k0 * (d / pn.d0)))
      setView(clampView({ k, x: mid.x - k * pn.wx, y: mid.y - k * pn.wy }, vb))
      return
    }

    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.on && dx * dx + dy * dy > 16) {
      d.on = true
      swallowClick.current = true
      if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId)
      setHover(null)
      setAnim(0)
      setDragging(true)
    }
    if (d.on) {
      const g = geom()
      if (!g) return
      setView((v) => clampView({ ...v, x: d.ox + dx / g.s, y: d.oy + dy / g.s }, vb))
    }
  }
  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    pts.current.delete(e.pointerId)
    if (pts.current.size < 2) pinch.current = null
    if (drag.current?.id === e.pointerId) drag.current = null
    if (pts.current.size === 0) setDragging(false)
  }

  const onDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const p = toMap(e.clientX, e.clientY)
    setAnim(2)
    setView((v) => zoomAbout(v, 1.8, p.x, p.y, vb))
  }

  // Keyboard: + / - zoom, 0 fits, arrows pan. The map owns the screen, so the keys work page-wide
  // (except while typing, and while the map is hidden on phones).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (!wrapRef.current || wrapRef.current.getClientRects().length === 0) return
      const move = (dx: number, dy: number) => {
        e.preventDefault()
        setAnim(1)
        setView((v) => clampView({ ...v, x: v.x + dx, y: v.y + dy }, vb))
      }
      const zoom = (f: number) => {
        setAnim(2)
        setView((v) => zoomAbout(v, f, vx + vw / 2, vy + vh / 2, vb))
      }
      if (e.key === '+' || e.key === '=') zoom(1.35)
      else if (e.key === '-' || e.key === '_') zoom(1 / 1.35)
      else if (e.key === '0') {
        setAnim(2)
        setView({ k: 1, x: 0, y: 0 })
      } else if (e.key === 'ArrowLeft') move(90, 0)
      else if (e.key === 'ArrowRight') move(-90, 0)
      else if (e.key === 'ArrowUp') move(0, 90)
      else if (e.key === 'ArrowDown') move(0, -90)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  const go = (tag: string) => {
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    router.push(`/tags/${slug(tag)}`)
  }

  const showTip = (e: React.PointerEvent, tag: string, n: number, ci: number) => {
    if (e.pointerType !== 'mouse' || dragging) return
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    setHover({ tag, n, ci, x: e.clientX - r.left, y: e.clientY - r.top })
  }

  const transition =
    anim === 0
      ? 'none'
      : anim === 1
        ? 'transform .12s ease-out'
        : 'transform .38s cubic-bezier(.4,0,.2,1)'

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label={`Tag map: ${totalTags} tags in ${layout.clusters.length} categories. Plus and minus zoom, zero fits, arrow keys pan.`}
      className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-white dark:bg-gray-950"
      style={{ top }}
    >
      {/* faint grid, same as the page hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-gray-900 opacity-[0.045] dark:text-white"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <svg
        ref={svgRef}
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        className="tw-root absolute inset-0 block h-full w-full font-mono select-none"
        style={{
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={onDoubleClick}
      >
        <style>{CSS}</style>
        <defs>
          <filter id="tw-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="tw-core-fill" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>
        </defs>

        <g
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: '0 0',
            transition,
          }}
        >
          {/* faint links between neighbouring categories */}
          {ring.length > 2 &&
            ring.map((c, i) => {
              const o = ring[(i + 1) % ring.length]
              return (
                <path
                  key={`l-${c.label}`}
                  className="tw-link"
                  d={curve(c.x, c.y, o.x, o.y, 0.28, true)}
                />
              )
            })}

          {/* branches: core -> the hex of each cluster nearest to it */}
          {layout.clusters.map((c, i) => {
            const dim = matches && !c.tags.some((t) => matches.has(t))
            const on = hover?.ci === i
            return (
              <path
                key={`b-${c.label}`}
                className={`tw-branch tw-fade ${on ? 'tw-on' : ''} ${dim ? 'tw-dim' : ''}`}
                d={curve(0, 0, c.link.x, c.link.y, i % 2 === 0 ? 0.12 : -0.12)}
              />
            )
          })}

          {/* the core */}
          <g>
            <polygon className="tw-core-ring" points={hexPoints(CORE_R + 14)} />
            <polygon
              points={hexPoints(CORE_R)}
              fill="url(#tw-core-fill)"
              stroke="#ef4444"
              strokeWidth={2}
              filter="url(#tw-glow)"
            />
            <text
              y={-4}
              textAnchor="middle"
              fill="#fff"
              fontSize={15}
              fontWeight={800}
              letterSpacing="0.06em"
            >
              {title.split(' ')[0].toUpperCase()}
            </text>
            <text
              y={14}
              textAnchor="middle"
              fill="#fff"
              fontSize={15}
              fontWeight={800}
              letterSpacing="0.06em"
            >
              {title.split(' ').slice(1).join(' ').toUpperCase()}
            </text>
            <text y={34} textAnchor="middle" fill="#fff" fillOpacity={0.7} fontSize={10}>
              {totalTags} tags
            </text>
          </g>

          {/* clusters */}
          {layout.clusters.map((c, ci) => {
            const clusterDim = matches && !c.tags.some((t) => matches.has(t))
            const bodyTop = c.y - c.bodyH / 2
            const ulW = Math.round(c.label.length * 13.4)
            return (
              <g key={c.label} className={`tw-fade ${clusterDim ? 'tw-dim' : ''}`}>
                <g className="tw-enter" style={{ ['--d' as string]: `${ci * 70}ms` }}>
                  <text
                    className="tw-cat tw-ink"
                    x={c.x}
                    y={Math.round(bodyTop - 22)}
                    textAnchor="middle"
                  >
                    {c.label.toUpperCase()}
                  </text>
                  <rect
                    className="tw-ul"
                    x={Math.round(c.x - ulW / 2)}
                    y={Math.round(bodyTop - 13)}
                    width={ulW}
                    height={3}
                    rx={1.5}
                  />
                  <text
                    className="tw-mute"
                    x={Math.round(c.x + ulW / 2 + 9)}
                    y={Math.round(bodyTop - 22)}
                    fontSize={13}
                  >
                    {c.tags.length}
                  </text>
                </g>

                {c.cells.map((cell, i) => {
                  const n = counts[cell.tag] ?? 0
                  const heat = heatOf(n)
                  const lines = wrapTag(cell.tag)
                  const longest = Math.max(...lines.map((l) => l.length))
                  const fs = Math.max(8, Math.min(12, 62 / (0.6 * longest)))
                  const lh = fs * 1.18
                  const miss = matches && !matches.has(cell.tag)
                  return (
                    <g
                      key={cell.tag}
                      transform={`translate(${c.x + cell.x} ${c.y + cell.y})`}
                      className={`tw-fade ${miss ? 'tw-dim' : ''}`}
                    >
                      <g
                        className="tw-enter"
                        style={{ ['--d' as string]: `${ci * 70 + i * 22}ms` }}
                      >
                        <g
                          className={`tw-hex tw-${heat}`}
                          role="link"
                          tabIndex={0}
                          aria-label={`View ${n} post${n === 1 ? '' : 's'} tagged ${cell.tag}`}
                          onClick={() => go(cell.tag)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              go(cell.tag)
                            }
                          }}
                          onPointerEnter={(e) => showTip(e, cell.tag, n, ci)}
                          onPointerMove={(e) => showTip(e, cell.tag, n, ci)}
                          onPointerLeave={() => setHover(null)}
                        >
                          <polygon className="tw-bg" points={TILE} />
                          <polygon className="tw-poly" points={TILE} />
                          <g style={{ opacity: labelOp }} className="tw-fade">
                            {lines.map((l, k) => (
                              <text
                                key={k}
                                className="tw-lbl"
                                y={
                                  Math.round(((k - (lines.length - 1) / 2) * lh + fs * 0.36) * 10) /
                                  10
                                }
                                textAnchor="middle"
                                fontSize={Math.round(fs * 10) / 10}
                              >
                                {l}
                              </text>
                            ))}
                          </g>
                        </g>
                      </g>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </g>
      </svg>

      {/* page title, drawn over the corner the layout keeps free */}
      {children && (
        <div className="pointer-events-none absolute top-4 left-6 max-w-[min(34rem,60vw)]">
          {children}
        </div>
      )}

      {/* hover card */}
      {hover && !dragging && (
        <div
          className={`pointer-events-none absolute z-10 px-2.5 py-1.5 font-mono text-xs whitespace-nowrap text-gray-900 dark:text-gray-100 ${PANEL}`}
          style={
            hover.x > size.w - 230
              ? { right: size.w - hover.x + 14, top: hover.y + 16 }
              : { left: hover.x + 14, top: hover.y + 16 }
          }
        >
          <span className="font-bold text-red-500">#</span>
          {hover.tag}
          <span className="ml-2 text-gray-500">
            {hover.n} post{hover.n === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* controls: zoom stack, then FIND / INFO (bottom right) */}
      <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-end gap-2.5 sm:right-5 sm:bottom-5">
        <div
          className={`pointer-events-auto flex flex-col divide-y divide-gray-200 overflow-hidden dark:divide-gray-700/70 ${PANEL}`}
        >
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in (+)"
            onClick={() => step(1.35)}
            className={ICON_BTN}
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            aria-label="Fit to screen"
            title="Fit to screen (0)"
            onClick={fit}
            className={ICON_BTN}
          >
            <FitIcon />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out (-)"
            onClick={() => step(1 / 1.35)}
            className={ICON_BTN}
          >
            <MinusIcon />
          </button>
        </div>

        <div
          className={`pointer-events-auto relative flex items-center gap-5 px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase ${PANEL}`}
        >
          {panel === 'find' && (
            <div
              className={`absolute right-full bottom-0 mr-2.5 w-72 p-3 tracking-normal normal-case ${PANEL}`}
            >
              <label className="flex items-center gap-2 text-sm font-normal">
                <span className="font-bold text-red-500">$</span>
                <input
                  ref={findRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') focusMatches()
                    if (e.key === 'Escape') toggle('find')
                  }}
                  placeholder="find a tag or category…"
                  aria-label="Find a tag or category"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-0 focus:outline-none dark:text-gray-100"
                />
                {matches && (
                  <span className="text-xs text-gray-500 tabular-nums">{matches.size}</span>
                )}
              </label>
              <p className="mt-2 text-[11px] font-normal text-gray-500">
                Enter zooms to the matches. Esc closes.
              </p>
            </div>
          )}

          {panel === 'info' && (
            <div
              className={`absolute right-full bottom-0 mr-2.5 w-72 p-4 text-xs font-normal tracking-normal normal-case ${PANEL}`}
            >
              <p className="mb-3 font-bold tracking-widest text-gray-700 uppercase dark:text-gray-300">
                <span className="text-red-500">#</span> tag heat
              </p>
              <ul className="space-y-2">
                {(['hot', 'warm', 'cool'] as Heat[]).map((h) => (
                  <li key={h} className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${h === 'hot' ? 'bg-red-500' : h === 'warm' ? 'bg-amber-500' : 'bg-slate-400'}`}
                    />
                    <span className="w-10 font-bold text-gray-900 dark:text-gray-100">{h}</span>
                    <span className="flex-1 text-gray-500">{ranges[h]}</span>
                    <span className="text-gray-700 tabular-nums dark:text-gray-300">
                      {tiers[h]}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-gray-200 pt-3 leading-relaxed text-gray-500 dark:border-gray-700/70">
                Drag to pan, scroll or pinch to zoom, double-click to zoom in. Keys: + / − zoom, 0
                fits, arrows pan. Click a hex to open its posts. {totalTags} tags in{' '}
                {layout.clusters.length} categories.
              </p>
            </div>
          )}

          <button
            type="button"
            aria-expanded={panel === 'find'}
            onClick={() => toggle('find')}
            className={`flex items-center gap-2 transition-colors hover:text-gray-900 dark:hover:text-white ${panel === 'find' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Find <SearchIcon />
          </button>
          <button
            type="button"
            aria-expanded={panel === 'info'}
            onClick={() => toggle('info')}
            className={`flex items-center gap-2 transition-colors hover:text-gray-900 dark:hover:text-white ${panel === 'info' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Info <InfoIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
