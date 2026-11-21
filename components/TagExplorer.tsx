'use client'

import { useState } from 'react'
import { slug } from 'github-slugger'
import Link from '@/components/Link'
import TagWeb from '@/components/TagWeb'

type Section = { label: string; tags: string[] }

interface Props {
  sections: Section[]
  counts: Record<string, number>
}

// --- Heat tiers ------------------------------------------------------------
// A tag's "heat" is how many posts use it. Change the two thresholds to
// re-tier the whole page (hex colours, INFO legend and phone chips follow).
const HOT_MIN = 5
const WARM_MIN = 2

type Heat = 'hot' | 'warm' | 'cool'

const heatOf = (count: number): Heat =>
  count >= HOT_MIN ? 'hot' : count >= WARM_MIN ? 'warm' : 'cool'

const RANGES: Record<Heat, string> = {
  hot: `${HOT_MIN}+ posts`,
  warm: `${WARM_MIN}–${HOT_MIN - 1} posts`,
  cool: WARM_MIN - 1 === 1 ? '1 post' : `1–${WARM_MIN - 1} posts`,
}

const CHIP: Record<Heat, { chip: string; count: string; dot: string }> = {
  hot: {
    chip: 'border-red-500/40 hover:border-red-500/70 hover:text-red-700 dark:hover:text-red-400',
    count: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  warm: {
    chip: 'border-amber-500/40 hover:border-amber-500/70 hover:text-amber-700 dark:hover:text-amber-400',
    count: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  cool: {
    chip: 'border-gray-300 hover:border-red-500/50 hover:text-red-700 dark:border-gray-800 dark:hover:text-red-400',
    count: 'text-gray-500',
    dot: 'bg-slate-400',
  },
}

const ROW_LIMIT = 10

function Chip({ tag, count }: { tag: string; count: number }) {
  const heat = heatOf(count)
  return (
    <Link
      href={`/tags/${slug(tag)}`}
      aria-label={`View ${count} post${count === 1 ? '' : 's'} tagged ${tag}`}
      className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-sm text-gray-700 transition-colors duration-150 dark:text-gray-300 ${CHIP[heat].chip}`}
    >
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${CHIP[heat].dot}`} />
      <span>{tag}</span>
      <span className={`tabular-nums ${CHIP[heat].count}`}>{count}</span>
    </Link>
  )
}

function Hero({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <h1
        className={`font-sans leading-tight font-bold tracking-tight text-gray-900 dark:text-gray-100 ${
          compact ? 'mb-2 text-4xl' : 'mb-5 text-5xl md:text-6xl'
        }`}
      >
        <span>Tag </span>
        <span className="text-red-500">Index</span>
      </h1>
      <div
        className={`font-mono text-gray-900 dark:text-gray-400 ${compact ? 'text-sm leading-relaxed' : 'text-lg leading-loose'}`}
      >
        <p className="text-gray-600 dark:text-gray-400/60">
          # Everything I write about, indexed. The hotter the tag, the more posts.
        </p>
        <p className="mt-1 font-bold">
          <span className="mr-2 text-red-600 dark:text-red-500">$</span>
          <span className="text-gray-900 dark:text-gray-100">ls ~/archive/tags</span>
        </p>
      </div>
    </div>
  )
}

export default function TagExplorer({ sections, counts }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const totalTags = sections.reduce((n, s) => n + s.tags.length, 0)

  if (totalTags === 0) {
    return (
      <div className="pt-10 pb-16">
        <Hero />
        <p className="mt-6 font-mono text-gray-500">$ no tags found.</p>
      </div>
    )
  }

  return (
    <>
      {/* md and up: the map owns the screen below the header; the title sits in its top-left corner */}
      <div className="hidden md:block">
        <TagWeb sections={sections} counts={counts} heatOf={heatOf} ranges={RANGES}>
          <Hero compact />
        </TagWeb>
      </div>

      {/* phones: plain list, one row per category */}
      <div className="pb-16 md:hidden">
        <div className="relative overflow-hidden pt-10 pb-8">
          <Hero />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800/70">
          {sections.map((section) => {
            const expanded = !!open[section.label]
            const list = expanded ? section.tags : section.tags.slice(0, ROW_LIMIT)
            const hidden = section.tags.length - list.length
            return (
              <div key={section.label} className="grid gap-y-2.5 py-4 first:pt-0 last:pb-0">
                <h2 className="font-mono text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  <span className="text-red-500">#</span> {section.label}
                  <span className="ml-2 font-normal text-gray-500">{section.tags.length}</span>
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {list.map((t) => (
                    <Chip key={t} tag={t} count={counts[t]} />
                  ))}
                  {section.tags.length > ROW_LIMIT && (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen((o) => ({ ...o, [section.label]: !o[section.label] }))}
                      className="rounded border border-dashed border-gray-300 px-3 py-1.5 font-mono text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:hover:text-gray-200"
                    >
                      {expanded ? 'show less' : `+${hidden} more`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
