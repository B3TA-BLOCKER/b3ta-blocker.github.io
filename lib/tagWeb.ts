// Layout engine for the tag web on /tags.
//
// One central node, one honeycomb cluster per category, each tag a regular
// pointy-top hexagon (like the Hextree map). Everything here is plain
// arithmetic (no Math.sin/cos/sqrt) on purpose: the page is server-rendered and
// then hydrated, and trig can differ in the last digit between Node and the
// browser, which would cause hydration warnings.

export const HEX_R = 44 // circumradius of one tile
export const HEX_W = 76.2 // tile width  = sqrt(3) * HEX_R (pointy-top)
export const HEX_H = 88 // tile height = 2 * HEX_R
const ROW = 66 // vertical pitch = 0.75 * HEX_H
export const LABEL_H = 50 // room above each cluster for the category title
export const CORE_R = 66 // radius of the central hexagon

const PAD = 10 // breathing room around a cluster when packing
const CORE_BOX = CORE_R + 30 // half-size of the keep-out square around the core

export interface WebCell {
  tag: string
  x: number // relative to the cluster origin
  y: number
}

export interface WebCluster {
  label: string
  tags: string[]
  cells: WebCell[]
  bodyW: number
  bodyH: number
  slot: number // angular position around the core, used to order the faint ring links
  x: number // absolute position of the cluster origin (centre of its honeycomb)
  y: number
  link: { x: number; y: number } // centre of the hex closest to the core: where the branch attaches
}

export interface WebLayout {
  clusters: WebCluster[]
  viewBox: [number, number, number, number]
}

/**
 * Parts of the screen the page draws over the map (title top-left, controls
 * bottom-right). The packer keeps clusters out of these corners so nothing is
 * ever covered. Sizes are in map units, which is about 1 screen pixel at fit.
 */
export interface Keepout {
  corner: 'tl' | 'tr' | 'bl' | 'br'
  w: number
  h: number
}
export const DEFAULT_KEEPOUTS: Keepout[] = [
  { corner: 'tl', w: 380, h: 150 },
  { corner: 'br', w: 250, h: 270 },
]

interface Rect {
  l: number
  r: number
  t: number
  b: number
}

// 10 fixed directions around an ellipse, clockwise from the top
const SLOTS: [number, number][] = [
  [0, -1],
  [0.588, -0.809],
  [0.951, -0.309],
  [0.951, 0.309],
  [0.588, 0.809],
  [0, 1],
  [-0.588, 0.809],
  [-0.951, 0.309],
  [-0.951, -0.309],
  [-0.588, -0.809],
]

/**
 * The n tiles closest to the centre, in order of distance (centre first).
 * Taking the nearest tiles, instead of walking a spiral, keeps a half-filled
 * outer ring symmetrical, so every cluster comes out as a round blob.
 */
function nearest(n: number): [number, number][] {
  let rings = 0
  while (1 + 3 * rings * (rings + 1) < n) rings++
  const cells: { q: number; r: number; d: number; i: number }[] = []
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      if (Math.abs(q + r) > rings) continue // stay inside the hexagonal disc
      const x = HEX_W * (q + r / 2)
      const y = ROW * r
      cells.push({ q, r, d: Math.round(x * x + y * y), i: cells.length })
    }
  }
  cells.sort((a, b) => a.d - b.d || a.i - b.i)
  return cells.slice(0, n).map((c) => [c.q, c.r])
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

type Measured = Omit<WebCluster, 'slot' | 'x' | 'y' | 'link'> & { boxW: number }

function measure(label: string, tags: string[]): Measured {
  const raw = nearest(tags.length).map(([q, r]) => ({
    x: HEX_W * (q + r / 2), // pointy-top: every other row is shifted half a tile
    y: ROW * r,
  }))
  const minX = Math.min(...raw.map((p) => p.x)) - HEX_W / 2
  const maxX = Math.max(...raw.map((p) => p.x)) + HEX_W / 2
  const minY = Math.min(...raw.map((p) => p.y)) - HEX_H / 2
  const maxY = Math.max(...raw.map((p) => p.y)) + HEX_H / 2
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return {
    label,
    tags,
    cells: raw.map((p, i) => ({ tag: tags[i], x: Math.round(p.x - cx), y: Math.round(p.y - cy) })),
    bodyW: maxX - minX,
    bodyH: maxY - minY,
    boxW: Math.max(maxX - minX, label.length * 13.4 + 50), // the title can be wider than the hexes
  }
}

type Placed = Measured & { slot: number; x: number; y: number }

const box = (c: Placed): Rect => ({
  l: c.x - c.boxW / 2 - PAD,
  r: c.x + c.boxW / 2 + PAD,
  t: c.y - c.bodyH / 2 - LABEL_H - PAD,
  b: c.y + c.bodyH / 2 + PAD,
})

/**
 * Pull every cluster toward the core, then push overlapping boxes apart.
 * Deterministic, so the same tags always give the same picture.
 */
function relax(
  placed: Placed[],
  statics: Rect[],
  iterations: number,
  pullX: number,
  pullY: number
) {
  const n = placed.length
  for (let it = 0; it < iterations; it++) {
    for (const c of placed) {
      c.x -= c.x * pullX
      c.y -= c.y * pullY
    }
    for (let pass = 0; pass < 3; pass++) {
      for (const c of placed) {
        for (const w of statics) {
          const b = box(c)
          const cx = (b.l + b.r) / 2
          const cy = (b.t + b.b) / 2
          const wx = (w.l + w.r) / 2
          const wy = (w.t + w.b) / 2
          const ox = (b.r - b.l + (w.r - w.l)) / 2 - Math.abs(cx - wx)
          const oy = (b.b - b.t + (w.b - w.t)) / 2 - Math.abs(cy - wy)
          if (ox > 0 && oy > 0) {
            if (ox < oy) c.x += (cx >= wx ? 1 : -1) * ox
            else c.y += (cy >= wy ? 1 : -1) * oy
          }
        }
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = box(placed[i])
          const b = box(placed[j])
          const acx = (a.l + a.r) / 2
          const bcx = (b.l + b.r) / 2
          const acy = (a.t + a.b) / 2
          const bcy = (b.t + b.b) / 2
          const ox = (a.r - a.l + (b.r - b.l)) / 2 - Math.abs(acx - bcx)
          const oy = (a.b - a.t + (b.b - b.t)) / 2 - Math.abs(acy - bcy)
          if (ox > 0 && oy > 0) {
            if (ox < oy) {
              const s = bcx >= acx ? 1 : -1
              placed[i].x -= (s * ox) / 2
              placed[j].x += (s * ox) / 2
            } else {
              const s = bcy >= acy ? 1 : -1
              placed[i].y -= (s * oy) / 2
              placed[j].y += (s * oy) / 2
            }
          }
        }
      }
    }
  }
}

function bounds(rects: Rect[]): Rect {
  return {
    l: Math.min(...rects.map((r) => r.l)),
    r: Math.max(...rects.map((r) => r.r)),
    t: Math.min(...rects.map((r) => r.t)),
    b: Math.max(...rects.map((r) => r.b)),
  }
}

/** Packing knobs: starting ellipse and how hard clusters are pulled in on each axis. */
export interface Tune {
  rx: number
  ry: number
  pullX: number
  pullY: number
}
export const DEFAULT_TUNE: Tune = { rx: 1200, ry: 250, pullX: 0.02, pullY: 0.05 }

export function layoutWeb(
  sections: { label: string; tags: string[] }[],
  keepouts: Keepout[] = DEFAULT_KEEPOUTS,
  tune: Tune = DEFAULT_TUNE
): WebLayout {
  const measured = sections.filter((s) => s.tags.length > 0).map((s) => measure(s.label, s.tags))
  const n = measured.length
  if (n === 0) return { clusters: [], viewBox: [-200, -200, 400, 400] }

  // Biggest clusters first, then spread them around the core so large and small
  // categories alternate instead of the big ones bunching up on one side.
  const order = measured
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.tags.length - a.c.tags.length || a.i - b.i)
  const step = [3, 2, 1].find((s) => gcd(s, n) === 1) as number

  const placed: Placed[] = order.map(({ c }, i) => {
    const slot = (i * step) % n
    const idx = Math.floor((slot * 10) / n)
    const ring = 1 + Math.floor(idx / 10)
    const [ux, uy] = SLOTS[idx % 10]
    return { ...c, slot, x: ux * tune.rx * ring, y: uy * tune.ry * ring }
  })

  const core: Rect = { l: -CORE_BOX, r: CORE_BOX, t: -CORE_BOX, b: CORE_BOX }

  // Pass 1: pack around the core only, to learn how big the picture is.
  relax(placed, [core], 700, tune.pullX, tune.pullY)
  const b1 = bounds([core, ...placed.map(box)])

  // Pass 2: reserve the corners the page draws over (title, controls) and pack again.
  const reserved: Rect[] = keepouts.map((k) => ({
    l: k.corner === 'tl' || k.corner === 'bl' ? b1.l : b1.r - k.w,
    r: k.corner === 'tl' || k.corner === 'bl' ? b1.l + k.w : b1.r,
    t: k.corner === 'tl' || k.corner === 'tr' ? b1.t : b1.b - k.h,
    b: k.corner === 'tl' || k.corner === 'tr' ? b1.t + k.h : b1.b,
  }))
  relax(placed, [core, ...reserved], 500, tune.pullX, tune.pullY)

  const clusters: WebCluster[] = placed.map((c) => {
    const x = Math.round(c.x)
    const y = Math.round(c.y)
    let link = { x: x + c.cells[0].x, y: y + c.cells[0].y }
    let best = Infinity
    for (const cell of c.cells) {
      const ax = x + cell.x
      const ay = y + cell.y
      const d = ax * ax + ay * ay
      if (d < best) {
        best = d
        link = { x: ax, y: ay }
      }
    }
    return {
      label: c.label,
      tags: c.tags,
      cells: c.cells,
      bodyW: c.bodyW,
      bodyH: c.bodyH,
      slot: c.slot,
      x,
      y,
      link,
    }
  })

  const M = 24
  const all = bounds([core, ...reserved, ...placed.map(box)])
  return {
    clusters,
    viewBox: [
      Math.floor(all.l - M),
      Math.floor(all.t - M),
      Math.ceil(all.r - all.l + 2 * M),
      Math.ceil(all.b - all.t + 2 * M),
    ],
  }
}

/**
 * Split a tag into at most three short lines, breaking after hyphens.
 * Prefers narrow lines (they fit a hexagon) and only widens when it must.
 */
export function wrapTag(tag: string): string[] {
  const parts = tag.match(/[^-]+-?/g) ?? [tag]
  for (const max of [9, 12, 16, 99]) {
    const lines: string[] = []
    let line = ''
    for (const p of parts) {
      if (line && (line + p).length > max) {
        lines.push(line)
        line = p
      } else {
        line += p
      }
    }
    if (line) lines.push(line)
    if (lines.length <= 3) return lines
  }
  return [tag]
}

// --- Pan / zoom -------------------------------------------------------------
// The picture is drawn inside one <g> with transform = translate(x y) scale(k),
// in the same units as the viewBox. These helpers are pure so they can be tested.

export interface View {
  k: number
  x: number
  y: number
}

export const K_MIN = 0.6
export const K_MAX = 5

type ViewBox = [number, number, number, number]

/** Keep the picture inside the viewport (and k inside its limits). */
export function clampView(v: View, vb: ViewBox): View {
  const [vx, , vw] = vb
  const [, vy, , vh] = vb
  const k = Math.min(K_MAX, Math.max(K_MIN, v.k))
  const clampAxis = (t: number, origin: number, size: number) => {
    const a = origin - k * origin
    const b = origin + size - k * (origin + size)
    return Math.min(Math.max(t, Math.min(a, b)), Math.max(a, b))
  }
  return { k, x: clampAxis(v.x, vx, vw), y: clampAxis(v.y, vy, vh) }
}

/** Zoom by `factor` keeping the point (sx, sy) of the viewport fixed. */
export function zoomAbout(v: View, factor: number, sx: number, sy: number, vb: ViewBox): View {
  const k = Math.min(K_MAX, Math.max(K_MIN, v.k * factor))
  const f = k / v.k
  return clampView({ k, x: sx - f * (sx - v.x), y: sy - f * (sy - v.y) }, vb)
}

/** A view of zoom k with the world point (px, py) in the middle of the viewport. */
export function focusOn(px: number, py: number, k: number, vb: ViewBox): View {
  const cx = vb[0] + vb[2] / 2
  const cy = vb[1] + vb[3] / 2
  return clampView({ k, x: cx - k * px, y: cy - k * py }, vb)
}
