import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import Image from 'next/image'
import NewsletterForm from '@/components/NewsletterForm'

const MAX_DISPLAY = 3

export default function Home({ posts }) {
  return (
    <>
      <div className="divide-y divide-gray-800 dark:divide-gray-700">
        <div className="relative overflow-hidden pt-10 pb-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="mb-5 inline-flex items-center rounded border-2 border-red-600/50 px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-red-700 dark:border-red-500/30 dark:text-red-500">
            Hack · Learn · Repeat
          </div>
          <h1 className="mb-5 font-sans text-5xl leading-tight font-bold tracking-tight text-gray-900 md:text-6xl dark:text-gray-100">
            Bukhari's <span className="text-red-500">Archive</span>
            <span
              className="ml-1 inline-block w-[3px] bg-red-500 align-middle"
              style={{ height: '1em', animation: 'blink 1s step-end infinite' }}
            />
          </h1>
          <div className="font-mono text-sm leading-loose text-gray-900 dark:text-gray-400">
            <p className="text-lg text-gray-600 dark:text-gray-400/60">
              # My journey through CTFs, labs, and everything in between.
            </p>
            <p className="mt-1 font-bold">
              <span className="mr-2 text-red-600 dark:text-red-500">$</span>
              <span className="text-gray-900 dark:text-gray-100">ls ~/archive</span>
            </p>
            <div className="mt-0.5 ml-4 grid grid-cols-3 gap-x-6 gap-y-0.5 font-bold text-green-700 dark:text-green-400">
              <span>htb-machines/</span>
              <span>challenges/</span>
              <span>dev-notes/</span>
            </div>
            <p className="mt-1 font-bold">
              <span className="mr-2 text-red-600 dark:text-red-500">$</span>
              <span
                className="inline-block w-[3px] bg-red-600 align-middle dark:bg-red-500"
                style={{ height: '1em', animation: 'blink 1s step-end infinite' }}
              />
            </p>
          </div>
        </div>

        <ul className="divide-y divide-gray-800 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags, images, locked } = post
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="flex items-start gap-6">
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
                        {/* Lock overlay on image */}
                        {locked && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                            <span className="text-2xl">🔒</span>
                          </div>
                        )}
                      </div>
                      <dd className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </Link>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h2 className="flex items-center gap-2 text-2xl leading-8 font-bold tracking-tight">
                          <Link href={`/blog/${slug}`} className="text-gray-900 dark:text-gray-100">
                            {title}
                          </Link>
                          {locked && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#e53e3e',
                                border: '1px solid rgba(229,62,62,0.4)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Active
                            </span>
                          )}
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
                          {locked ? 'View details →' : 'Read more →'}
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

      <div className="mt-8">
        <NewsletterForm />
      </div>
    </>
  )
}
