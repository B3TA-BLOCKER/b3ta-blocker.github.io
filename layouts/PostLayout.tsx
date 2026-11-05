import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Image from 'next/image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import TableOfContents from '@/components/TableOfContents'
import { ViewTracker } from '@/components/ViewCount'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

// Turns a tweet URL like https://x.com/user/status/12345 into a reply-intent
// link that opens X with the reply box already focused, ready to type.
// Falls back to the plain tweet URL if the ID can't be parsed.
const getReplyUrl = (tweetUrl: string) => {
  const match = tweetUrl.match(/status\/(\d+)/)
  return match ? `https://twitter.com/intent/tweet?in_reply_to=${match[1]}` : tweetUrl
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string; images?: string[] }
  prev?: { path: string; title: string; images?: string[] }
  toc?: { value: string; url: string; depth: number }[]
  children: ReactNode
}

// Heading shown inside the post banner.
// 1. If the post sets `bannerTitle` in its frontmatter, that is used as-is.
// 2. Otherwise it is the part of `title` before the first " (" or " — ", e.g.
//    "Nexus Machine (HackTheBox) — Step-by-Step Walkthrough" becomes "Nexus Machine".
//    Titles with neither (e.g. "Primed for Action") are unchanged.
// The full `title` is still used for the page <title>, post lists, SEO and image alt text.
const getBannerTitle = (title: string, bannerTitle?: string) =>
  bannerTitle?.trim() || title.split(/\s+\(|\s+—\s+/)[0].trim() || title

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  toc,
  children,
}: LayoutProps) {
  const { path, date, title, bannerTitle, tags, twitterUrl, images } = content
  const heading = getBannerTitle(title, bannerTitle)
  // First entry of `images` in the post frontmatter is the machine logo
  const cover = Array.isArray(images) ? images[0] : images
  const formattedDate = new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)
  const basePath = path.split('/')[0]
  const hasToc = Boolean(toc && toc.length > 1)

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <ViewTracker slug={path} />
      <article>
        <div>
          <header className="pt-6 pb-2">
            {cover ? (
              // Cover banner: blurred, darkened copy of the machine logo as the backdrop
              // (hides the low resolution of small logos), crisp logo on the right.
              <div className="relative isolate overflow-hidden rounded-2xl border border-gray-800/60 bg-gray-950 shadow-lg dark:border-gray-700">
                <Image
                  src={cover}
                  alt=""
                  fill
                  priority
                  aria-hidden="true"
                  sizes="100vw"
                  className="-z-20 scale-150 object-cover opacity-80 blur-3xl saturate-150"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
                <div className="flex flex-col items-center gap-8 px-6 py-12 text-center sm:px-10 md:flex-row md:justify-between md:py-16 md:text-left">
                  <div className="min-w-0 flex-1 space-y-4">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base leading-6 font-medium tracking-wide text-gray-300">
                        <time dateTime={date}>{formattedDate}</time>
                      </dd>
                    </dl>
                    <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-white sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
                      {heading}
                    </h1>
                  </div>
                  <div className="relative hidden h-40 w-40 shrink-0 sm:block lg:h-52 lg:w-52">
                    <Image
                      src={cover}
                      alt={`${title} logo`}
                      fill
                      sizes="208px"
                      className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                <dl className="space-y-10">
                  <div>
                    <dt className="sr-only">Published on</dt>
                    <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                      <time dateTime={date}>{formattedDate}</time>
                    </dd>
                  </div>
                </dl>
                <div>
                  <PageTitle>{heading}</PageTitle>
                </div>
              </div>
            )}
          </header>

          {/* Glowing divider between banner and content */}
          <div
            aria-hidden="true"
            className="mx-auto mt-2 h-px w-full bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-[0_10px_30px_4px_rgba(255,255,255,0.18)]"
          />

          {/* Single-row 3-column grid: left rail | article | TOC rail.
              All three cells sit in row 1, so CSS Grid's default stretch
              makes the two side cells exactly as tall as the article cell —
              which is what lets `sticky` inside them track the full length
              of the post instead of running out of room early. */}
          <div
            className={`grid-rows-[auto_1fr] divide-y divide-gray-800 pb-8 xl:grid xl:items-start xl:gap-x-8 xl:divide-y-0 dark:divide-gray-700 ${
              hasToc ? 'xl:grid-cols-[13rem_minmax(0,1fr)_11rem]' : 'xl:grid-cols-[13rem_1fr]'
            }`}
          >
            {/* Left rail — author, tags, prev/next, back link */}
            <div className="xl:sticky xl:top-28 xl:pt-2">
              <dl className="border-b border-gray-800 pt-6 pb-10 dark:border-gray-700">
                <dt className="sr-only">Authors</dt>
                <dd>
                  <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12 xl:block xl:space-y-8 xl:space-x-0">
                    {authorDetails.map((author) => (
                      <li className="flex items-center space-x-2" key={author.name}>
                        {author.avatar && (
                          <Image
                            src={author.avatar}
                            width={38}
                            height={38}
                            alt="avatar"
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <dl className="text-sm leading-5 font-medium whitespace-nowrap">
                          <dt className="sr-only">Name</dt>
                          <dd className="text-gray-900 dark:text-gray-100">{author.name}</dd>
                          <dt className="sr-only">Twitter</dt>
                          <dd>
                            {author.twitter && (
                              <Link
                                href={author.twitter}
                                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {author.twitter
                                  .replace('https://twitter.com/', '@')
                                  .replace('https://x.com/', '@')}
                              </Link>
                            )}
                          </dd>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </dd>
              </dl>
              <div className="divide-gray-800 text-sm leading-5 font-medium xl:divide-y dark:divide-gray-700">
                {tags && (
                  <div className="py-4 xl:py-8">
                    <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                      Tags
                    </h2>
                    <div className="flex flex-wrap">
                      {tags.map((tag) => (
                        <Tag key={tag} text={tag} />
                      ))}
                    </div>
                  </div>
                )}
                {(next || prev) && (
                  <div className="flex flex-col gap-4 py-4 xl:py-8">
                    {prev && prev.path && (
                      <div>
                        <h2 className="mb-2 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                          Previous Article
                        </h2>
                        <Link href={`/${prev.path}`}>
                          <div className="flex items-center gap-3 transition-opacity hover:opacity-80">
                            {prev.images?.[0] && (
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                  src={prev.images[0]}
                                  alt={prev.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="text-primary-500 line-clamp-2 text-sm font-medium">
                              {prev.title}
                            </span>
                          </div>
                        </Link>
                      </div>
                    )}
                    {next && next.path && (
                      <div>
                        <h2 className="mb-2 text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                          Next Article
                        </h2>
                        <Link href={`/${next.path}`}>
                          <div className="flex items-center gap-3 transition-opacity hover:opacity-80">
                            {next.images?.[0] && (
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                  src={next.images[0]}
                                  alt={next.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="text-primary-500 line-clamp-2 text-sm font-medium">
                              {next.title}
                            </span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-4 xl:pt-8">
                <Link
                  href={`/${basePath}`}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  aria-label="Back to the blog"
                >
                  &larr; Back to the blog
                </Link>
              </div>
            </div>

            {/* Center — the article itself */}
            <div className="divide-y divide-gray-800 xl:pb-0 dark:divide-gray-700">
              <div className="prose dark:prose-invert max-w-none pt-8 pb-8 [&>:first-child]:mt-0 [&>:first-child>:first-child]:mt-0">
                {children}
              </div>
              {twitterUrl && (
                <div className="pt-6 pb-6">
                  <Link
                    href={getReplyUrl(twitterUrl)}
                    rel="nofollow"
                    className="group hover:border-primary-500 dark:hover:border-primary-400 relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-gray-300 bg-gray-50 px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-transform duration-200 group-hover:scale-110 dark:bg-white dark:text-black">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="h-5 w-5 fill-current"
                        >
                          <path d="M18.9 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          Think I missed an angle? Tell me on X.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Reply with your own approach, a sharper exploit path, or just roast the
                          writeup.
                        </p>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="group-hover:text-primary-500 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 5l7 7-7 7M5 12h14"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Right rail — table of contents. Offset (pt-8) = left rail pt-2 + author pt-6,
                so the heading row lines up with the author avatar row. The column is
                11rem but -ml-4 lets the block reach back 16px into the grid gap, so it
                is still 12rem wide, ends on the right margin, and the article gets +1rem. */}
            {hasToc && (
              <div className="hidden xl:sticky xl:top-28 xl:-ml-4 xl:block xl:pt-8">
                <TableOfContents toc={toc!} />
              </div>
            )}
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
