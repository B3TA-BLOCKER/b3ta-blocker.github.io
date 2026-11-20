'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { slug } from 'github-slugger'
import { CORE_R, layoutWeb, wrapTag } from '@/lib/tagWeb'

type Heat = 'hot' | 'warm' | 'cool'

interface Props {
  sections: { label: string; tags: string[] }[]
  counts: Record<string, number>
  heatOf: (count: number) => Heat
  /** Tags that match the live filter. null = no filter active. */
  matches: Set<string> | null
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

export default function TagWeb({
  sections,
  counts,
  heatOf,
  matches,
  title = "Bukhari's Archive",
}: Props) {
  const router = useRouter()
  const layout = useMemo(() => layoutWeb(sections), [sections])
  const totalTags = layout.clusters.reduce((n, c) => n + c.tags.length, 0)
  const [vx, vy, vw, vh] = layout.viewBox

  const ring = useMemo(
    () => [...layout.clusters].sort((a, b) => a.slot - b.slot),
    [layout.clusters]
  )

  const go = (tag: string) => router.push(`/tags/${slug(tag)}`)

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className="tw-root block h-auto w-full font-mono"
      role="group"
      aria-label={`Tag web: ${totalTags} tags in ${layout.clusters.length} categories`}
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
        <text
          y={-6}
          textAnchor="middle"
          fill="#fff"
          fontSize={17}
          fontWeight={700}
          letterSpacing="0.06em"
        >
          {title.split(' ')[0].toUpperCase()}
        </text>
        <text
          y={14}
          textAnchor="middle"
          fill="#fff"
          fontSize={17}
          fontWeight={700}
          letterSpacing="0.06em"
        >
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
              <text className="tw-cat tw-ink" x={c.x} y={Math.round(top - 22)} textAnchor="middle">
                {c.label.toUpperCase()}
              </text>
              <rect
                className="tw-ul"
                x={Math.round(c.x - ulW / 2)}
                y={Math.round(top - 12)}
                width={ulW}
                height={3}
                rx={1.5}
              />
              <text
                className="tw-mute"
                x={Math.round(c.x + ulW / 2 + 10)}
                y={Math.round(top - 22)}
                fontSize={14}
              >
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
                      <text
                        className="tw-cnt"
                        y={26}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                      >
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
    </svg>
  )
}
