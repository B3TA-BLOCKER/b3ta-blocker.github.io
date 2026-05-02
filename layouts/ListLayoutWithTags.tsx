'use client'

import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'
import Image from 'next/image'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname
    .replace(/^\//, '')
    .replace(/\/page\/\d+\/?$/, '')
    .replace(/\/$/, '')
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <>
      <div>
        <div className="pt-6 pb-6">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:hidden sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
        </div>
        <div className="flex sm:space-x-24">
          {/* Sidebar */}
          <div className="hidden h-full max-h-screen max-w-[280px] min-w-[280px] flex-wrap overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md sm:flex dark:bg-gray-900/70 dark:shadow-gray-800/40">
            <div className="px-6 py-4">
              {pathname.startsWith('/blog') ? (
                <h3 className="text-primary-500 font-bold uppercase">All Posts</h3>
              ) : (
                <Link
                  href={`/blog`}
                  className="hover:text-primary-500 dark:hover:text-primary-500 font-bold text-gray-700 uppercase dark:text-gray-300"
                >
                  All Posts
                </Link>
              )}
              <ul>
                {sortedTags.map((t) => (
                  <li key={t} className="my-3">
                    {decodeURI(pathname.split('/tags/')[1]) === slug(t) ? (
                      <h3 className="text-primary-500 inline px-3 py-2 text-sm font-bold uppercase">
                        {`${t} (${tagCounts[t]})`}
                      </h3>
                    ) : (
                      <Link
                        href={`/tags/${slug(t)}`}
                        className="hover:text-primary-500 dark:hover:text-primary-500 px-3 py-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-300"
                        aria-label={`View posts tagged ${t}`}
                      >
                        {`${t} (${tagCounts[t]})`}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Clean List */}
          <div className="flex-1">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayPosts.map((post) => {
                const { path, date, title, summary, tags, images } = post
                return (
                  <li key={path} className="py-5">
                    <article className="flex gap-4 items-center">
                      {images?.[0] && (
                        <div className="shrink-0">
                          <Link href={`/${path}`}>
                            <div className="relative h-30 w-30 overflow-hidden rounded-full">
                              <Image
                                src={images[0]}
                                alt={title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        </div>
                      )}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <time
                            dateTime={date}
                            className="text-sm font-medium text-gray-500 dark:text-gray-400"
                          >
                            {formatDate(date, siteMetadata.locale)}
                          </time>
                        </div>
                        <h2 className="text-xl leading-8 font-bold tracking-tight">
                          <Link
                            href={`/${path}`}
                            className="text-gray-900 dark:text-gray-100 hover:text-primary-500 dark:hover:text-primary-400"
                          >
                            {title}
                          </Link>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {tags?.map((tag) => <Tag key={tag} text={tag} />)}
                        </div>
                        <p className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </p>
                        <Link
                          href={`/${path}`}
                          className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            {pagination && pagination.totalPages > 1 && (
              <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
