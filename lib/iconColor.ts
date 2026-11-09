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

export const SILVER_GLOW = 'hsl(215 12% 68%)'
/** Silver is invisible on white, so light mode uses a deeper blue-grey slate. */
export const SLATE_GLOW = 'hsl(215 42% 44%)'

/** Used for monochrome icons and when an icon can't be sampled (cross-origin image…). */
export const NEUTRAL_GLOW: GlowColors = {
  dark: SILVER_GLOW,
  light: SLATE_GLOW,
  text: 'hsl(215 25% 88%)', // near-white, so a hovered title doesn't dim
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
    // Essentially monochrome edge (black/white/grey): soft silver (slate on white).
    return NEUTRAL_GLOW
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
  const h = Math.round(hue)
  const dark = `hsl(${h} ${Math.round(s * 100)}% 58%)`
  return {
    dark,
    light: `hsl(${h} ${Math.round(Math.min(0.9, s + 0.05) * 100)}% 46%)`,
    text: dark,
  }
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
