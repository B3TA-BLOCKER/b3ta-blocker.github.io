'use client'

import { useMemo, useState } from 'react'
import { slug } from 'github-slugger'
import Link from '@/components/Link'

type Section = { label: string; tags: string[] }

interface Props {
  sections: Section[]
  counts: Record<string, number>
  top: string[]
}

// --- Heat tiers ------------------------------------------------------------
// A tag's "heat" is how many posts use it. Change the two thresholds to
// re-tier the whole page (chips, leaderboard bars and the legend follow).
const HOT_MIN = 10
const WARM_MIN = 3

type Heat = 'hot' | 'warm' | 'cool'

const heatOf = (count: number): Heat =>
  count >= HOT_MIN ? 'hot' : count >= WARM_MIN ? 'warm' : 'cool'

const HEAT_ORDER: Heat[] = ['hot', 'warm', 'cool']

const HEAT: Record<
  Heat,
  {
    range: string
    chip: string
    count: string
    dot: string
    dotFlat: string
    bar: string
    text: string
  }
> = {
  hot: {
    range: `${HOT_MIN}+ posts`,
    chip: 'border-red-500/40 hover:border-red-500/70 hover:text-red-700 dark:hover:text-red-400',
    count: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]',
    dotFlat: 'bg-red-500',
    bar: 'from-red-700 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]',
    text: 'text-red-700 dark:text-red-400',
  },
  warm: {
    range: `${WARM_MIN}–${HOT_MIN - 1} posts`,
    chip: 'border-amber-500/40 hover:border-amber-500/70 hover:text-amber-700 dark:hover:text-amber-400',
    count: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
    dotFlat: 'bg-amber-500',
    bar: 'from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.55)]',
    text: 'text-amber-700 dark:text-amber-400',
  },
  cool: {
    range: `1–${WARM_MIN - 1} posts`,
    chip: 'border-gray-300 hover:border-sky-500/60 hover:text-sky-700 dark:border-gray-800 dark:hover:text-sky-400',
    count: 'text-gray-500',
    dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]',
    dotFlat: 'bg-sky-500/60',
    bar: 'from-sky-600 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]',
    text: 'text-sky-700 dark:text-sky-400',
  },
}

// Quiet by default: neutral chips with a small heat dot. Colour only shows up
// as a hairline border on hot/warm tags and on hover.
const ROW_LIMIT = 10

const SEGMENT: Record<Heat, string> = {
  hot: 'bg-red-500',
  warm: 'bg-amber-500',
  cool: 'bg-sky-500',
}

function Window({
  title,
  meta,
  className = '',
  children,
}: {
  title: string
  meta?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-300 bg-white/60 shadow-sm dark:border-gray-800 dark:bg-gray-900/40 ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-300 bg-gray-100 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 font-mono text-xs text-gray-500">{title}</span>
        {meta && <span className="ml-auto font-mono text-xs text-gray-500">{meta}</span>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function WindowHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-mono text-base font-semibold tracking-widest text-gray-700 uppercase sm:text-lg dark:text-gray-300">
      <span className="text-primary-500">#</span> {children}
    </h2>
  )
}

function Chip({ tag, count }: { tag: string; count: number }) {
  const heat = heatOf(count)
  return (
    <Link
      href={`/tags/${slug(tag)}`}
      aria-label={`View ${count} post${count === 1 ? '' : 's'} tagged ${tag}`}
      className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-sm text-gray-700 transition-colors duration-150 dark:text-gray-300 ${HEAT[heat].chip}`}
    >
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${HEAT[heat].dotFlat}`} />
      <span>{tag}</span>
      <span className={`tabular-nums ${HEAT[heat].count}`}>{count}</span>
    </Link>
  )
}

export default function TagExplorer({ sections, counts, top }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const q = query.trim().toLowerCase().replace(/\s+/g, '-')

  const totalTags = useMemo(() => sections.reduce((n, s) => n + s.tags.length, 0), [sections])

  const tiers = useMemo(() => {
    const n: Record<Heat, number> = { hot: 0, warm: 0, cool: 0 }
    sections.forEach((s) => s.tags.forEach((t) => (n[heatOf(counts[t])] += 1)))
    return n
  }, [sections, counts])

  const visible = useMemo(
    () =>
      sections
        .map((s) => ({
          ...s,
          tags: q ? s.tags.filter((t) => t.includes(q)) : s.tags,
        }))
        .filter((s) => s.tags.length > 0),
    [sections, q]
  )

  const shown = visible.reduce((n, s) => n + s.tags.length, 0)
  const maxCount = top.length > 0 ? counts[top[0]] : 1
  const showTop = !q && top.length > 0

  return (
    <div className="pb-16">
      {/* Hero — mirrors the home page hero (grid backdrop, h1, terminal) */}
      <div className="relative overflow-hidden pt-10 pb-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <h1 className="mb-5 font-sans text-5xl leading-tight font-bold tracking-tight text-gray-900 md:text-6xl dark:text-gray-100">
          <span>Tag </span>
          <span className="text-red-500">Index</span>
        </h1>

        <div className="font-mono text-lg leading-loose text-gray-900 dark:text-gray-400">
          <p className="text-lg text-gray-600 dark:text-gray-400/60">
            # Everything I write about, indexed. The hotter the tag, the more posts.
          </p>
          <p className="mt-1 font-bold">
            <span className="mr-2 text-red-600 dark:text-red-500">$</span>
            <span className="text-gray-900 dark:text-gray-100">ls ~/archive/tags</span>
          </p>
        </div>
      </div>

      {/* Filter prompt */}
      <p className="mb-2 font-mono text-base text-gray-600 dark:text-gray-400/60">
        # Live filter: type a keyword and the index below is grepped as you type.
      </p>
      <label className="focus-within:border-primary-500 mb-8 flex items-center gap-3 rounded-lg border border-gray-300 bg-white/60 px-4 py-3 font-mono text-base transition-colors dark:border-gray-800 dark:bg-gray-900/40">
        <span className="text-primary-600 dark:text-primary-500 font-bold">$</span>
        <span className="text-gray-500 dark:text-gray-400">grep -i</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter tags…"
          aria-label="Filter tags"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-0 focus:outline-none dark:text-gray-100"
        />
        <span className="shrink-0 text-xs text-gray-500 tabular-nums">
          {shown}/{totalTags}
        </span>
      </label>

      {totalTags === 0 && <p className="font-mono text-gray-500">$ no tags found.</p>}

      {/* Analytics: heat distribution (the key) + leaderboard */}
      {totalTags > 0 && (
        <div className="mb-5 grid gap-5 md:grid-cols-2">
          <Window
            title="heat-map.log"
            meta={`${totalTags} tags`}
            className={showTop ? '' : 'md:col-span-2'}
          >
            <WindowHeading>tag heat</WindowHeading>
            <p className="mb-3 font-mono text-sm font-bold">
              <span className="mr-2 text-red-600 dark:text-red-500">$</span>
              <span className="text-gray-900 dark:text-gray-100">tags --group-by=heat</span>
            </p>

            <div
              className="mb-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`Tag distribution: ${tiers.hot} hot, ${tiers.warm} warm, ${tiers.cool} cool`}
            >
              {HEAT_ORDER.filter((h) => tiers[h] > 0).map((h) => (
                <span
                  key={h}
                  className={`${SEGMENT[h]} block h-full`}
                  style={{ flexGrow: tiers[h], flexBasis: 0, minWidth: '0.75rem' }}
                />
              ))}
            </div>

            <ul className="space-y-2 font-mono text-sm">
              {HEAT_ORDER.map((h) => (
                <li key={h} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${HEAT[h].dot}`} />
                  <span className={`w-12 font-bold ${HEAT[h].text}`}>{h}</span>
                  <span className="flex-1 text-gray-600 dark:text-gray-400">{HEAT[h].range}</span>
                  <span className="text-gray-900 tabular-nums dark:text-gray-100">
                    {tiers[h]} {tiers[h] === 1 ? 'tag' : 'tags'}
                  </span>
                  <span className="w-10 text-right text-gray-500 tabular-nums">
                    {Math.round((tiers[h] / totalTags) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </Window>

          {showTop && (
            <Window title="top-tags.log" meta={`top ${top.length}`}>
              <WindowHeading>most written about</WindowHeading>
              <div className="space-y-3">
                {top.map((t) => {
                  const heat = heatOf(counts[t])
                  return (
                    <Link
                      key={t}
                      href={`/tags/${slug(t)}`}
                      aria-label={`View ${counts[t]} posts tagged ${t}`}
                      className="group grid grid-cols-[minmax(0,9rem)_1fr_1.5rem] items-center gap-3 font-mono text-sm sm:grid-cols-[minmax(0,12rem)_1fr_1.5rem]"
                    >
                      <span className="group-hover:text-primary-700 dark:group-hover:text-primary-400 truncate text-gray-800 transition-colors dark:text-gray-200">
                        <span className={HEAT[heat].text}>#</span>
                        {t}
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <span
                          className={`block h-full rounded-full bg-gradient-to-r ${HEAT[heat].bar}`}
                          style={{ width: `${Math.max(6, (counts[t] / maxCount) * 100)}%` }}
                        />
                      </span>
                      <span className="text-right text-gray-500 tabular-nums">{counts[t]}</span>
                    </Link>
                  )
                })}
              </div>
            </Window>
          )}
        </div>
      )}

      {/* Category index: one compact window, one row per category */}
      {visible.length > 0 && (
        <Window title="index.tags" meta={`${visible.length} categories`}>
          <p className="mb-4 font-mono text-sm font-bold">
            <span className="mr-2 text-red-600 dark:text-red-500">$</span>
            <span className="text-gray-900 dark:text-gray-100">tags --by-category</span>
          </p>
          <div className="divide-y divide-gray-200 dark:divide-gray-800/70">
            {visible.map((section) => {
              const expanded = !!q || !!open[section.label]
              const list = expanded ? section.tags : section.tags.slice(0, ROW_LIMIT)
              const hidden = section.tags.length - list.length
              return (
                <div
                  key={section.label}
                  className="grid gap-x-6 gap-y-2.5 py-4 first:pt-0 last:pb-0 sm:grid-cols-[16rem_1fr]"
                >
                  <h2 className="font-mono text-sm font-semibold tracking-wider text-gray-700 uppercase sm:pt-2 dark:text-gray-300">
                    <span className="text-red-500">#</span> {section.label}
                    <span className="ml-2 font-normal text-gray-500">{section.tags.length}</span>
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    {list.map((t) => (
                      <Chip key={t} tag={t} count={counts[t]} />
                    ))}
                    {!q && section.tags.length > ROW_LIMIT && (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() =>
                          setOpen((o) => ({ ...o, [section.label]: !o[section.label] }))
                        }
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
        </Window>
      )}

      {q && visible.length === 0 && (
        <p className="font-mono text-gray-500">$ no tags match &quot;{query.trim()}&quot;</p>
      )}
    </div>
  )
}
