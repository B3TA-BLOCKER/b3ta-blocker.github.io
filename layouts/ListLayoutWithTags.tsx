'use client'

import { usePathname } from 'next/navigation'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
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
          <button className="cursor-auto opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
          >
            Previous
          </Link>
        )}
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
          >
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
  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <>
      <div>
        <div className="pt-2 pb-2" />
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {displayPosts.map((post) => {
            const { path, date, title, summary, tags, images, locked } = post
            return (
              <li key={path} className="py-5">
                <article className="flex gap-4 items-center">
                  {images?.[0] && (
                    <div className="shrink-0">
                      <Link href={`/${path}`}>
                        <div className="relative h-30 w-30 overflow-hidden rounded-full">
                          <Image src={images[0]} alt={title} fill className="object-cover" />
                          {locked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                              <span className="text-sm">🔒</span>
                            </div>
                          )}
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
                    <h2 className="text-xl leading-8 font-bold tracking-tight flex items-center gap-2">
                      <Link
                        href={`/${path}`}
                        className="text-gray-900 dark:text-gray-100 hover:text-primary-500 dark:hover:text-primary-400"
                      >
                        {title}
                      </Link>
                      {locked && (
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#e53e3e',
                          border: '1px solid rgba(229,62,62,0.4)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          whiteSpace: 'nowrap',
                        }}>
                          Active
                        </span>
                      )}
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
                      {locked ? 'View details →' : 'Read more →'}
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
    </>
  )
}