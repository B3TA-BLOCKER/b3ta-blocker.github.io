import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import Image from 'next/image'

const MAX_DISPLAY = 7

export default function Home({ posts }) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="relative overflow-hidden pt-10 pb-8">

          {/* Grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Live badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded border border-red-500/30 px-3 py-1 font-mono text-[11px] tracking-widest text-red-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            LIVE — writeups dropping regularly
          </div>

          {/* Title */}
          <h1 className="mb-4 font-sans text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 md:text-6xl">
            Bukhari's
            <br />
            <span className="text-red-500">Archive</span>
            <span className="ml-1 inline-block h-[1em] w-[3px] animate-[blink_1s_step-end_infinite] bg-red-500 align-middle" />
          </h1>

          {/* Terminal subtitle */}
          <p className="mb-6 font-mono text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            <span className="mr-2 text-red-500">$</span>cat about.txt
            <br />
            CTF writeups · Pentesting labs · Machines rooted, methods documented.
          </p>

        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags, images } = post
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="flex gap-6 items-start">
                    <Link href={`/blog/${slug}`} className="shrink-0">
                      <div className="relative h-36 w-36 overflow-hidden rounded-xl">
                        {images?.[0] ? (
                          <Image
                            src={images[0]}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-800 text-sm text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <dd className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </Link>
                    <div className="space-y-3 flex-1">
                      <div>
                        <h2 className="text-2xl leading-8 font-bold tracking-tight">
                          <Link
                            href={`/blog/${slug}`}
                            className="text-gray-900 dark:text-gray-100"
                          >
                            {title}
                          </Link>
                        </h2>
                        <div className="flex flex-wrap">
                          {tags.map((tag) => (
                            <Tag key={tag} text={tag} />
                          ))}
                        </div>
                      </div>
                      <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                        {summary}
                      </div>
                      <div className="text-base leading-6 font-medium">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>

      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base leading-6 font-medium">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
    </>
  )
}
