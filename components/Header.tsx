'use client'

import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import CustomSearch from './CustomSearch'
import { usePathname } from 'next/navigation'
import { allBlogs } from 'contentlayer/generated'
import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'

const Header = () => {
  const pathname = usePathname()
  const isHome = pathname === '/'

  let headerClass = 'flex items-center w-full bg-white dark:bg-gray-950 justify-between py-10'
  if (siteMetadata.stickyNav) {
    headerClass += ' sticky top-0 z-50'
  }

  const posts = allCoreContent(sortPosts(allBlogs))
  const days = posts[0]
    ? Math.floor((Date.now() - new Date(posts[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <header className={headerClass}>
      {isHome ? (
        <div className="inline-flex items-center gap-2 rounded border border-green-500/30 px-3 py-1 font-mono text-[11px] tracking-widest text-green-500">
          <span
            className="h-1.5 w-1.5 rounded-full bg-green-500"
            style={{ animation: 'dotglow 1.4s ease-in-out infinite' }}
          />
          Latest post — {days === 0 ? 'today' : `${days}d ago`}
        </div>
      ) : (
        <Link href="/" aria-label={siteMetadata.headerTitle}>
          <div className="flex items-center">
            <div className="mr-3">
              <Logo />
            </div>
            {typeof siteMetadata.headerTitle === 'string' ? (
              <div className="h-6 text-2xl font-semibold">
                {siteMetadata.headerTitle}
              </div>
            ) : (
              siteMetadata.headerTitle
            )}
          </div>
        </Link>
      )}

      <div className="flex items-center space-x-4 leading-5 sm:-mr-6 sm:space-x-6">
        <div className="no-scrollbar hidden max-w-40 items-center gap-x-4 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-900 dark:text-gray-100"
              >
                {link.title}
              </Link>
            ))}
        </div>
        <CustomSearch />
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
