// Picks a hover-glow colour from the *edge* of a post icon, so the glow always
// matches the artwork: a lime ring glows lime, a purple ring glows purple, a
// dark monochrome photo glows soft silver, a brown photo glows warm amber.

/**
 * A glow colour in the three forms the page needs:
 *  - dark:  glow on dark pages (light, vivid)
 *  - light: glow on white pages (deeper, so it stays visible)
 *  - text:  colour a title turns on hover in dark mode
 */
export interface GlowColors {
  dark: string
  light: string
  text: string
}

/**
 * Used when an icon has no colour to take a glow from (a black-and-white photo)
 * and for the first paint before an icon has been read. A white or silver glow
 * would be invisible on a dark page and a hovered title could not stand out from
 * it, so this is a clear cyber-blue that suits the site and shows on both themes.
 */
export const ACCENT_GLOW: GlowColors = {
  dark: 'hsl(205 100% 62%)',
  light: 'hsl(208 90% 40%)',
  text: 'hsl(205 100% 76%)',
}

/** The three glow colours for a hue (0-360) and saturation (0-1). */
function colorsFromHue(hue: number, sat: number): GlowColors {
  const h = Math.round(hue)
  const dark = `hsl(${h} ${Math.round(sat * 100)}% 58%)`
  return {
    dark,
    light: `hsl(${h} ${Math.round(Math.min(0.9, sat + 0.05) * 100)}% 46%)`,
    text: dark,
  }
}

type RGB = [number, number, number]

function toHsl([r, g, b]: RGB): { h: number; s: number; l: number } {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === R) h = ((G - B) / d) % 6
  else if (max === G) h = (B - R) / d + 2
  else h = (R - G) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

/**
 * Most vivid hue anywhere inside the circular crop of the icon, or null if the
 * artwork is essentially colourless (needs at least ~1.2% clearly coloured pixels).
 */
function accentFromWholeIcon(data: ArrayLike<number>, size: number): GlowColors | null {
  const c = (size - 1) / 2
  const bins = new Array(18).fill(0)
  const sums = new Array(18).fill(0).map(() => ({ x: 0, y: 0, s: 0, n: 0 }))
  let total = 0
  let vivid = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - c, y - c) > 0.5 * size) continue
      const p = (y * size + x) * 4
      if (data[p + 3] < 200) continue
      total++
      const { h, s, l } = toHsl([data[p], data[p + 1], data[p + 2]])
      if (s < 0.4 || l < 0.22 || l > 0.85) continue
      vivid++
      const w = s * (1 - Math.abs(2 * l - 1))
      const b = Math.floor(h / 20) % 18
      bins[b] += w
      sums[b].x += Math.cos((h * Math.PI) / 180) * w
      sums[b].y += Math.sin((h * Math.PI) / 180) * w
      sums[b].s += s
      sums[b].n++
    }
  }
  if (total === 0 || vivid / total < 0.012) return null
  const best = bins.indexOf(Math.max(...bins))
  const { x, y, s, n } = sums[best]
  if (n === 0) return null
  const hue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return colorsFromHue(hue, Math.min(0.9, Math.max(0.6, (s / n) * 1.2)))
}

/**
 * `data` is RGBA pixel data of the icon drawn into a square `size` x `size`
 * canvas. Returns a CSS colour, or null if too few edge pixels were opaque.
 */
export function edgeGlowFromPixels(data: ArrayLike<number>, size: number): GlowColors | null {
  const c = (size - 1) / 2
  const samples: { rgb: RGB; h: number; s: number; l: number }[] = []

  // Walk three rings just inside the circumference (where a round crop ends).
  for (const f of [0.43, 0.46, 0.485]) {
    const radius = f * size
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2
      const x = Math.round(c + radius * Math.cos(a))
      const y = Math.round(c + radius * Math.sin(a))
      const p = (y * size + x) * 4
      if (data[p + 3] < 200) continue // transparent corner of a round PNG
      const rgb: RGB = [data[p], data[p + 1], data[p + 2]]
      samples.push({ rgb, ...toHsl(rgb) })
    }
  }
  if (samples.length < 30) return null

  // How "coloured" a pixel is: saturation, damped near black/white where it's noise.
  const weight = (s: { s: number; l: number }) => s.s * Math.sqrt(1 - Math.abs(2 * s.l - 1))

  // Dominant hue = heaviest 20° bin of the hue histogram.
  const bins = new Array(18).fill(0)
  samples.forEach((s) => (bins[Math.floor(s.h / 20) % 18] += weight(s)))
  const best = bins.indexOf(Math.max(...bins))
  const inBin = samples.filter((s) => Math.floor(s.h / 20) % 18 === best)
  const avgWeight = inBin.reduce((n, s) => n + weight(s), 0) / samples.length

  if (avgWeight < 0.07) {
    // Monochrome edge (black/white/grey): borrow the most vivid colour found
    // anywhere in the artwork (a neon lock, orange terminal text…), or the accent.
    return accentFromWholeIcon(data, size) ?? ACCENT_GLOW
  }

  // Circular mean of the dominant hue, weighted by how coloured each pixel is.
  let sx = 0
  let sy = 0
  let sat = 0
  inBin.forEach((s) => {
    const w = weight(s)
    sx += Math.cos((s.h * Math.PI) / 180) * w
    sy += Math.sin((s.h * Math.PI) / 180) * w
    sat += s.s
  })
  const hue = ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360
  // Lift to a lightness that reads as a glow on both dark and white pages.
  const s = Math.min(0.85, Math.max(0.4, (sat / inBin.length) * 1.25))
  return colorsFromHue(hue, s)
}

/** Draws the loaded <img> into a small canvas and returns its edge glow colours. */
export function sampleEdgeGlow(img: HTMLImageElement): GlowColors | null {
  const SIZE = 64
  try {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, SIZE, SIZE)
    return edgeGlowFromPixels(ctx.getImageData(0, 0, SIZE, SIZE).data, SIZE)
  } catch {
    return null // tainted canvas (cross-origin image) or unsupported
  }
}
