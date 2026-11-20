// Layout engine for the tag web on /tags.
//
// One central node, one honeycomb cluster per category, each tag a hexagon.
// Everything here is plain arithmetic (no Math.sin/cos/sqrt) on purpose: the
// page is server-rendered and then hydrated, and trig can differ in the last
// digit between Node and the browser, which would cause hydration warnings.

export const HEX_W = 148 // corner to corner (flat-top hexagon, stretched wide for labels)
export const HEX_H = 78
export const LABEL_H = 52 // room above each cluster for the category title
export const CORE_R = 92 // radius of the central hexagon

const PAD = 9 // breathing room around a cluster when packing
const CORE_BOX = CORE_R + 34 // half-size of the keep-out square around the core

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

// Axial hex directions (Red Blob Games convention)
const DIRS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]

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

/** First n cells of a hex spiral: centre, then ring 1, ring 2, ... */
function spiral(n: number): [number, number][] {
  const out: [number, number][] = [[0, 0]]
  for (let k = 1; out.length < n; k++) {
    let q = -k
    let r = k
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < k; j++) {
        out.push([q, r])
        q += DIRS[i][0]
        r += DIRS[i][1]
      }
    }
  }
  return out.slice(0, n)
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

type Measured = Omit<WebCluster, 'slot' | 'x' | 'y' | 'link'>

function measure(label: string, tags: string[]): Measured {
  const raw = spiral(tags.length).map(([q, r]) => ({
    x: 0.75 * HEX_W * q,
    y: HEX_H * (r + q / 2),
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
  }
}

type Placed = Measured & { slot: number; x: number; y: number }

const box = (c: Placed) => ({
  l: c.x - c.bodyW / 2 - PAD,
  r: c.x + c.bodyW / 2 + PAD,
  t: c.y - c.bodyH / 2 - LABEL_H - PAD,
  b: c.y + c.bodyH / 2 + PAD,
})

export function layoutWeb(sections: { label: string; tags: string[] }[]): WebLayout {
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
    return { ...c, slot, x: ux * 640 * ring, y: uy * 400 * ring }
  })

  // Pack: pull everything toward the core, then push overlapping boxes apart.
  // Deterministic, so the same tags always give the same picture.
  for (let it = 0; it < 900; it++) {
    for (const c of placed) {
      c.x -= c.x * 0.012
      c.y -= c.y * 0.02
    }
    for (let pass = 0; pass < 3; pass++) {
      for (const c of placed) {
        const b = box(c)
        const cx = (b.l + b.r) / 2
        const cy = (b.t + b.b) / 2
        const ox = CORE_BOX + (b.r - b.l) / 2 - Math.abs(cx)
        const oy = CORE_BOX + (b.b - b.t) / 2 - Math.abs(cy)
        if (ox > 0 && oy > 0) {
          if (ox < oy) c.x += (cx >= 0 ? 1 : -1) * ox
          else c.y += (cy >= 0 ? 1 : -1) * oy
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
    return { ...c, x, y, link }
  })

  const M = 28
  let minX = -CORE_BOX
  let maxX = CORE_BOX
  let minY = -CORE_BOX
  let maxY = CORE_BOX
  for (const c of clusters) {
    const b = box(c)
    minX = Math.min(minX, b.l)
    maxX = Math.max(maxX, b.r)
    minY = Math.min(minY, b.t)
    maxY = Math.max(maxY, b.b)
  }

  return {
    clusters,
    viewBox: [
      Math.floor(minX - M),
      Math.floor(minY - M),
      Math.ceil(maxX - minX + 2 * M),
      Math.ceil(maxY - minY + 2 * M),
    ],
  }
}

/** Split a tag into at most two short lines, breaking after hyphens. */
export function wrapTag(tag: string, max = 13): string[] {
  const parts = tag.match(/[^-]+-?/g) ?? [tag]
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
  if (lines.length > 2) return [lines[0], lines.slice(1).join('')]
  return lines
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
