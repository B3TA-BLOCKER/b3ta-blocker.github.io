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
  children: ReactNode
}

export default function PostLayout({ content, authorDetails, next, prev, children }: LayoutProps) {
  const { path, date, title, tags, twitterUrl } = content
  const basePath = path.split('/')[0]

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-6 xl:pb-6">
            <div className="space-y-1 text-center">
              <dl className="space-y-10">
                <div>
                  <dt className="sr-only">Published on</dt>
                  <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>
                      {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                    </time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
            </div>
          </header>
          <div className="grid-rows-[auto_1fr] divide-y divide-gray-200 pb-8 xl:grid xl:grid-cols-4 xl:gap-x-6 xl:divide-y-0 dark:divide-gray-700">
            <dl className="pt-6 pb-10 xl:border-b xl:border-gray-200 xl:pt-11 xl:dark:border-gray-700">
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
            <div className="divide-y divide-gray-200 xl:col-span-3 xl:row-span-2 xl:pb-0 dark:divide-gray-700">
              <div className="prose dark:prose-invert max-w-none pt-10 pb-8">{children}</div>
              {twitterUrl && (
                <div className="pt-6 pb-6">
                  <Link
                    href={getReplyUrl(twitterUrl)}
                    rel="nofollow"
                    className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-primary-400"
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
                          Reply with your own approach, a sharper exploit path, or just roast the writeup.
                        </p>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
            <footer>
              <div className="divide-gray-200 text-sm leading-5 font-medium xl:col-start-1 xl:row-start-2 xl:divide-y dark:divide-gray-700">
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
                        <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400 mb-2">
                          Previous Article
                        </h2>
                        <Link href={`/${prev.path}`}>
                          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                            <span className="text-primary-500 text-sm font-medium line-clamp-2">
                              {prev.title}
                            </span>
                          </div>
                        </Link>
                      </div>
                    )}
                    {next && next.path && (
                      <div>
                        <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400 mb-2">
                          Next Article
                        </h2>
                        <Link href={`/${next.path}`}>
                          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                            <span className="text-primary-500 text-sm font-medium line-clamp-2">
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
            </footer>
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
