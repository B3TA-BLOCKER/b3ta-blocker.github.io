'use client'

import { useEffect, useState } from 'react'
import siteMetadata from '@/data/siteMetadata'

// Views are stored in a free, no-signup counter service (Abacus), because the
// site is a static GitHub Pages export and has no server of its own.
// To switch provider later, only COUNTER_API and `callCounter` need to change.
const COUNTER_API = 'https://abacus.jasoncameron.dev'

// One counter namespace per site, e.g. "b3ta-blocker-github-io".
const NAMESPACE = new URL(siteMetadata.siteUrl).hostname.replace(/[^a-z0-9]+/gi, '-')

// "blog/nexus" -> "nexus". Counter keys only allow letters, digits, "-", "_", ".".
const toKey = (slug: string) =>
  slug
    .split('/')
    .filter(Boolean)
    .pop()!
    .replace(/[^a-z0-9._-]+/gi, '-')
    .padEnd(3, '-')

// Only the real, deployed site is allowed to *count* a view, so local dev
// and preview builds never inflate the numbers.
const isLiveSite = () =>
  process.env.NODE_ENV === 'production' &&
  window.location.hostname === new URL(siteMetadata.siteUrl).hostname

async function callCounter(action: 'get' | 'hit', slug: string): Promise<number | null> {
  try {
    const res = await fetch(`${COUNTER_API}/${action}/${NAMESPACE}/${toKey(slug)}`, {
      cache: 'no-store',
    })
    // A post nobody has opened yet has no counter: that is simply 0 views.
    if (res.status === 404) return 0
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.value === 'number' ? data.value : null
  } catch {
    return null
  }
}

const compact = new Intl.NumberFormat(siteMetadata.locale, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0"
    aria-hidden="true"
  >
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Shows the view count of one post (read-only; used in post lists).
export default function ViewCount({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    callCounter('get', slug).then((v) => !cancelled && setViews(v))
    return () => {
      cancelled = true
    }
  }, [slug])

  // Counter unreachable (offline, blocked by an ad-blocker): hide it instead of showing a wrong 0.
  if (views === null) return null

  return (
    <span className="inline-flex items-center gap-1.5">
      <EyeIcon />
      <span>
        {views === undefined ? '—' : compact.format(views)} {views === 1 ? 'view' : 'views'}
      </span>
    </span>
  )
}

// Renders nothing. Placed on the post page to count one view per visitor
// per browser session (refreshing the page does not add more).
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!isLiveSite()) return
    const flag = `viewed:${toKey(slug)}`
    try {
      if (sessionStorage.getItem(flag)) return
      sessionStorage.setItem(flag, '1')
    } catch {
      // sessionStorage unavailable (private mode): count the view anyway
    }
    callCounter('hit', slug)
  }, [slug])

  return null
}
