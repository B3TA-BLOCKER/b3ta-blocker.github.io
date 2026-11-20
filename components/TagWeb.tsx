'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { slug } from 'github-slugger'
import { CORE_R, clampView, focusOn, layoutWeb, wrapTag, zoomAbout, type View } from '@/lib/tagWeb'

type Heat = 'hot' | 'warm' | 'cool'

interface Props {
  sections: { label: string; tags: string[] }[]
  counts: Record<string, number>
  heatOf: (count: number) => Heat
  /** Text for the INFO legend, e.g. { hot: '5+ posts', ... } */
  ranges: Record<Heat, string>
  title?: string
}

const r1 = (n: number) => Math.round(n * 10) / 10

// Flat-top hexagon, slightly inset from the tile so neighbours leave a gap
const HA = 70
const HB = 37
const HEX_POINTS = [
  [-HA, 0],
  [-HA / 2, -HB],
  [HA / 2, -HB],
  [HA, 0],
  [HA / 2, HB],
  [-HA / 2, HB],
]
  .map(([x, y]) => `${x},${y}`)
  .join(' ')

// Pointy-top hexagon for the core
const corePoints = (r: number) =>
  [
    [0, -r],
    [0.866 * r, -0.5 * r],
    [0.866 * r, 0.5 * r],
    [0, r],
    [-0.866 * r, 0.5 * r],
    [-0.866 * r, -0.5 * r],
  ]
    .map(([x, y]) => `${r1(x)},${r1(y)}`)
    .join(' ')

// Everything is class based (no CSS variables) and keyed off the site's `.dark` class.
const CSS = `
.tw-ink{fill:#111827}.tw-mute{fill:#6b7280}.tw-bg{fill:#ffffff}
.dark .tw-ink{fill:#e5e7eb}.dark .tw-mute{fill:#9ca3af}.dark .tw-bg{fill:#030712}

.tw-poly{fill-opacity:.11;stroke-opacity:.7;stroke-width:1.5;transition:fill-opacity .15s,stroke-opacity .15s,stroke-width .15s}
.tw-hot .tw-poly{fill:#dc2626;stroke:#dc2626}.tw-hot .tw-cnt{fill:#dc2626}
.tw-warm .tw-poly{fill:#d97706;stroke:#d97706}.tw-warm .tw-cnt{fill:#b45309}
.tw-cool .tw-poly{fill:#0284c7;stroke:#0284c7}.tw-cool .tw-cnt{fill:#0369a1}
.dark .tw-hot .tw-poly{fill:#ef4444;stroke:#ef4444}.dark .tw-hot .tw-cnt{fill:#f87171}
.dark .tw-warm .tw-poly{fill:#f59e0b;stroke:#f59e0b}.dark .tw-warm .tw-cnt{fill:#fbbf24}
.dark .tw-cool .tw-poly{fill:#0ea5e9;stroke:#0ea5e9}.dark .tw-cool .tw-cnt{fill:#38bdf8}
.tw-hot .tw-poly{filter:url(#tw-glow)}

.tw-hex{cursor:pointer;outline:none;transform-box:fill-box;transform-origin:center;transition:transform .15s ease}
.tw-hex:hover,.tw-hex:focus-visible{transform:scale(1.08)}
.tw-hex:hover .tw-poly,.tw-hex:focus-visible .tw-poly{fill-opacity:.3;stroke-opacity:1;stroke-width:2.5}
.tw-hex:hover .tw-ink,.tw-hex:focus-visible .tw-ink{fill:#ef4444}

.tw-cat{font-weight:700;letter-spacing:.08em;font-size:21px}
.tw-ul{fill:#ef4444}
.tw-branch{fill:none;stroke:#ef4444;stroke-opacity:.6;stroke-width:1.5;stroke-dasharray:3 7;animation:tw-flow 1.6s linear infinite}
.tw-link{fill:none;stroke:#6b7280;stroke-opacity:.28;stroke-width:1;stroke-dasharray:2 6}
.tw-core-ring{fill:none;stroke:#ef4444;stroke-opacity:.35;stroke-width:1.5;stroke-dasharray:4 6;transform-box:fill-box;transform-origin:center;animation:tw-pulse 3.2s ease-in-out infinite}

.tw-dim{opacity:.13}
.tw-fade{transition:opacity .2s ease}
.tw-enter{animation:tw-in .5s ease-out var(--d,0ms) both;transform-box:fill-box;transform-origin:center}

@keyframes tw-flow{to{stroke-dashoffset:-20}}
@keyframes tw-pulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.07);opacity:.35}}
@keyframes tw-in{from{opacity:0;transform:scale(.6)}}
@media (prefers-reduced-motion:reduce){.tw-branch,.tw-core-ring,.tw-enter{animation:none}}
`


const ICON = 'h-5 w-5'

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  )
}
function FitIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.2-4.2" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="currentColor" />
      <path d="M12 11v5.5" className="stroke-white dark:stroke-gray-900" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="1.4" className="fill-white dark:fill-gray-900" />
    </svg>
  )
}

const PANEL =
  'rounded-xl border border-gray-300 bg-white/90 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/90'
const ICON_BTN =
  'grid h-12 w-12 place-items-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'

function curve(x1: number, y1: number, x2: number, y2: number, bend: number, outward = false) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  // control point = midpoint pushed sideways; `bend` scales the push (0.12 = gentle arc)
  let px = -dy * bend
  let py = dx * bend
  if (outward && px * mx + py * my < 0) {
    px = -px
    py = -py
  }
  return `M${Math.round(x1)},${Math.round(y1)} Q${Math.round(mx + px)},${Math.round(my + py)} ${Math.round(x2)},${Math.round(y2)}`
}

export default function TagWeb({ sections, counts, heatOf, ranges, title = "Bukhari's Archive" }: Props) {
  const router = useRouter()
  const layout = useMemo(() => layoutWeb(sections), [sections])
  const totalTags = layout.clusters.reduce((n, c) => n + c.tags.length, 0)
  const vb = layout.viewBox
  const [vx, vy, vw, vh] = vb

  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 })
  const [animate, setAnimate] = useState(false) // smooth only for button / find moves, never while dragging
  const [dragging, setDragging] = useState(false)
  const [panel, setPanel] = useState<null | 'find' | 'info'>(null)
  const [query, setQuery] = useState('')
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; on: boolean } | null>(null)

  const ring = useMemo(() => [...layout.clusters].sort((a, b) => a.slot - b.slot), [layout.clusters])

  // --- find: tags (or whole categories) matching the query; everything else dims
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '-')
    if (!q) return null
    const qLabel = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

  // --- screen <-> viewBox conversion (the svg is letterboxed if its height is capped)
  const geom = () => {
    const el = svgRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const s = Math.min(r.width / vw, r.height / vh)
    return { r, s, offX: (r.width - vw * s) / 2, offY: (r.height - vh * s) / 2 }
  }
  const toUser = (cx: number, cy: number) => {
    const g = geom()
    if (!g) return { x: vx + vw / 2, y: vy + vh / 2 }
    return { x: vx + (cx - g.r.left - g.offX) / g.s, y: vy + (cy - g.r.top - g.offY) / g.s }
  }

  // Ctrl/Cmd + scroll (and trackpad pinch) zooms about the pointer. Plain scroll still scrolls the page.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const p = toUser(e.clientX, e.clientY)
      setAnimate(false)
      setView((v) => zoomAbout(v, Math.exp(-e.deltaY * 0.0025), p.x, p.y, vb))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  const step = (factor: number) => {
    setAnimate(true)
    setView((v) => zoomAbout(v, factor, vx + vw / 2, vy + vh / 2, vb))
  }
  const fit = () => {
    setAnimate(true)
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
    setAnimate(true)
    setView(focusOn(sx / n, sy / n, n === 1 ? 2.6 : n <= 6 ? 1.8 : 1.3, vb))
  }

  const toggle = (which: 'find' | 'info') => {
    setPanel((p) => {
      const next = p === which ? null : which
      if (next !== 'find') setQuery('')
      return next
    })
  }

  // --- drag to pan. Capture the pointer only once the mouse has really moved, so plain clicks still reach the hexes.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, on: false }
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.on && dx * dx + dy * dy > 16) {
      d.on = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setAnimate(false)
      setDragging(true)
    }
    if (d.on) {
      const g = geom()
      if (!g) return
      setView((v) => clampView({ ...v, x: d.ox + dx / g.s, y: d.oy + dy / g.s }, vb))
    }
  }
  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id === e.pointerId) {
      drag.current = null
      setDragging(false)
    }
  }

  const go = (tag: string) => router.push(`/tags/${slug(tag)}`)

  return (
    <div className="relative overflow-hidden">
    <svg
      ref={svgRef}
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className="tw-root block h-auto max-h-[calc(100svh-5rem)] w-full font-mono select-none"
      style={{
        touchAction: view.k > 1.01 ? 'none' : 'pan-y',
        cursor: dragging ? 'grabbing' : view.k > 1.01 ? 'grab' : 'default',
      }}
      role="group"
      aria-label={`Tag web: ${totalTags} tags in ${layout.clusters.length} categories`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <style>{CSS}</style>
      <defs>
        <filter id="tw-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="tw-core-fill" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      <g
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          transformOrigin: '0 0',
          transition: animate ? 'transform .35s cubic-bezier(.4,0,.2,1)' : 'none',
        }}
      >
      {/* faint links between neighbouring categories */}
      {ring.length > 2 &&
        ring.map((c, i) => {
          const o = ring[(i + 1) % ring.length]
          return <path key={`l-${c.label}`} className="tw-link" d={curve(c.x, c.y, o.x, o.y, 0.28, true)} />
        })}

      {/* branches: core -> the hex of each cluster nearest to it */}
      {layout.clusters.map((c, i) => {
        const dim = matches && !c.tags.some((t) => matches.has(t))
        return (
          <path
            key={`b-${c.label}`}
            className={`tw-branch tw-fade ${dim ? 'tw-dim' : ''}`}
            d={curve(0, 0, c.link.x, c.link.y, i % 2 === 0 ? 0.12 : -0.12)}
          />
        )
      })}

      {/* the core */}
      <g>
        <polygon className="tw-core-ring" points={corePoints(CORE_R + 16)} />
        <polygon
          points={corePoints(CORE_R)}
          fill="url(#tw-core-fill)"
          stroke="#ef4444"
          strokeWidth={2}
          filter="url(#tw-glow)"
        />
        <text y={-6} textAnchor="middle" fill="#fff" fontSize={17} fontWeight={700} letterSpacing="0.06em">
          {title.split(' ')[0].toUpperCase()}
        </text>
        <text y={14} textAnchor="middle" fill="#fff" fontSize={17} fontWeight={700} letterSpacing="0.06em">
          {title.split(' ').slice(1).join(' ').toUpperCase()}
        </text>
        <text y={36} textAnchor="middle" fill="#fff" fillOpacity={0.7} fontSize={11}>
          {totalTags} tags
        </text>
      </g>

      {/* clusters */}
      {layout.clusters.map((c, ci) => {
        const clusterDim = matches && !c.tags.some((t) => matches.has(t))
        const top = c.y - c.bodyH / 2
        const ulW = Math.round(c.label.length * 14.6)
        return (
          <g key={c.label} className={`tw-fade ${clusterDim ? 'tw-dim' : ''}`}>
            <g className="tw-enter" style={{ ['--d' as string]: `${ci * 70}ms` }}>
              <text
                className="tw-cat tw-ink"
                x={c.x}
                y={Math.round(top - 22)}
                textAnchor="middle"
              >
                {c.label.toUpperCase()}
              </text>
              <rect className="tw-ul" x={Math.round(c.x - ulW / 2)} y={Math.round(top - 12)} width={ulW} height={3} rx={1.5} />
              <text className="tw-mute" x={Math.round(c.x + ulW / 2 + 10)} y={Math.round(top - 22)} fontSize={14}>
                {c.tags.length}
              </text>
            </g>

            {c.cells.map((cell, i) => {
              const n = counts[cell.tag] ?? 0
              const heat = heatOf(n)
              const lines = wrapTag(cell.tag)
              const longest = Math.max(...lines.map((l) => l.length))
              const fs = longest > 15 ? 11 : 12.5
              const y0 = lines.length === 1 ? 3 : -8
              const miss = matches && !matches.has(cell.tag)
              return (
                <g
                  key={cell.tag}
                  transform={`translate(${c.x + cell.x} ${c.y + cell.y})`}
                  className={`tw-fade ${miss ? 'tw-dim' : ''}`}
                >
                  <g className="tw-enter" style={{ ['--d' as string]: `${ci * 70 + i * 25}ms` }}>
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
                    >
                      <title>{`${cell.tag} · ${n} post${n === 1 ? '' : 's'}`}</title>
                      <polygon className="tw-bg" points={HEX_POINTS} />
                      <polygon className="tw-poly" points={HEX_POINTS} />
                      {lines.map((l, k) => (
                        <text
                          key={k}
                          className="tw-ink"
                          y={y0 + k * 14}
                          textAnchor="middle"
                          fontSize={fs}
                        >
                          {l}
                        </text>
                      ))}
                      <text className="tw-cnt" y={26} textAnchor="middle" fontSize={11} fontWeight={700}>
                        {n}
                      </text>
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

    {/* controls: zoom stack, then FIND / INFO (bottom right) */}
    <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-end gap-3 sm:right-4 sm:bottom-4">
      <div className={`pointer-events-auto flex flex-col divide-y divide-gray-200 overflow-hidden dark:divide-gray-800 ${PANEL}`}>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => step(1.35)} className={ICON_BTN}>
          <PlusIcon />
        </button>
        <button type="button" aria-label="Fit to screen" title="Fit to screen" onClick={fit} className={ICON_BTN}>
          <FitIcon />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => step(1 / 1.35)} className={ICON_BTN}>
          <MinusIcon />
        </button>
      </div>

      <div className={`pointer-events-auto relative flex items-center gap-6 px-5 py-3.5 font-mono text-sm tracking-widest uppercase ${PANEL}`}>
        {panel === 'find' && (
          <div className={`absolute right-full bottom-0 mr-3 w-72 p-3 normal-case tracking-normal ${PANEL}`}>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-bold text-red-500">$</span>
              <input
                autoFocus
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
              {matches && <span className="text-xs text-gray-500 tabular-nums">{matches.size}</span>}
            </label>
            <p className="mt-2 text-[11px] text-gray-500">Enter to zoom to the matches. Esc to close.</p>
          </div>
        )}

        {panel === 'info' && (
          <div className={`absolute right-full bottom-0 mr-3 w-72 p-4 text-xs normal-case tracking-normal ${PANEL}`}>
            <p className="mb-3 font-bold tracking-widest text-gray-700 uppercase dark:text-gray-300">
              <span className="text-red-500">#</span> tag heat
            </p>
            <ul className="space-y-2">
              {(['hot', 'warm', 'cool'] as Heat[]).map((h) => (
                <li key={h} className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${h === 'hot' ? 'bg-red-500' : h === 'warm' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                  <span className="w-10 font-bold text-gray-900 dark:text-gray-100">{h}</span>
                  <span className="flex-1 text-gray-500">{ranges[h]}</span>
                  <span className="text-gray-700 tabular-nums dark:text-gray-300">{tiers[h]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-gray-200 pt-3 leading-relaxed text-gray-500 dark:border-gray-800">
              Drag to pan. Ctrl / ⌘ + scroll to zoom. Click a hex to open its posts.
              {' '}{totalTags} tags in {layout.clusters.length} categories.
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