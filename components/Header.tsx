'use client'
import { useEffect, useRef, useState } from 'react'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import CustomSearch from './CustomSearch'
import HandwrittenText from './HandwrittenText'
import { usePathname } from 'next/navigation'
import { allBlogs } from 'contentlayer/generated'
import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { hasSeenIntro, markIntroSeen, startIntroPhaseTwo } from '@/lib/introSequence'

function getRelativeTime(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const postDate = new Date(dateStr)
  postDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  return `${diffDays} days ago`
}

const Header = () => {
  const pathname = usePathname()
  const isHome = pathname === '/'

  let wrapperClass = 'w-full bg-white dark:bg-gray-950'
  if (siteMetadata.stickyNav) {
    wrapperClass += ' sticky top-0 z-50'
  }

  const posts = allCoreContent(sortPosts(allBlogs))
  const relativeTime = posts[0] ? getRelativeTime(posts[0].date) : null

  // Default to "already seen" so the very first paint (server + first client
  // render) matches — everything visible immediately, exactly as before.
  // The effect below flips this to false for a genuinely fresh session,
  // just before the nav is hidden and the intro starts.
  const [skipIntro, setSkipIntro] = useState(true)
  const [navReady, setNavReady] = useState(true)
  const navItemRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (!isHome) return
    const seen = hasSeenIntro()
    if (!seen) {
      setSkipIntro(false)
      setNavReady(false)
    }
  }, [isHome])

  function handleHandwritingDone() {
    setNavReady(true)
    navItemRefs.current.forEach((el, i) => {
      if (!el) return
      el.style.animation = `navItemIn 0.5s ease forwards, navItemGlow 0.6s ease forwards`
      el.style.animationDelay = `${i * 90}ms`
    })
    const glowTail = navItemRefs.current.length * 90 + 600
    setTimeout(() => {
      markIntroSeen()
      startIntroPhaseTwo()
    }, glowTail)
  }

  const visibleLinks = headerNavLinks.filter((link) => link.href !== '/')

  return (
    <div className={wrapperClass}>
      {/* Inner row stays centered and matches SectionContainer's max-width
          so nav content still lines up with the rest of the page. */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-10 sm:px-6 xl:max-w-6xl xl:px-0">
        {isHome ? (
          <div className="font-cursive inline-flex items-center gap-2 text-2xl font-bold tracking-wide text-green-700 dark:text-green-500">
            <span
              className="h-2 w-2 rounded-full bg-green-700 dark:bg-green-500"
              style={{ animation: 'dotglow 1.4s ease-in-out infinite' }}
            />
            {relativeTime && (
              <HandwrittenText
                text={`Latest post — ${relativeTime}`}
                skip={skipIntro}
                onDone={handleHandwritingDone}
              />
            )}
          </div>
        ) : (
          <Link href="/" aria-label={siteMetadata.headerTitle} className="block">
            <div className="flex items-center">
              {typeof siteMetadata.headerTitle === 'string' ? (
                <div className="h-6 text-2xl font-semibold">{siteMetadata.headerTitle}</div>
              ) : (
                siteMetadata.headerTitle
              )}
            </div>
          </Link>
        )}
        <div
          className="flex items-center space-x-4 leading-5 sm:-mr-6 sm:space-x-6"
          style={!navReady ? { opacity: 0, transform: 'translateY(-8px)' } : undefined}
        >
          <div className="no-scrollbar hidden max-w-40 items-center gap-x-4 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
            {visibleLinks.map((link, i) => (
              <span
                key={link.title}
                ref={(el) => {
                  navItemRefs.current[i] = el
                }}
                className="inline-block"
              >
                <Link
                  href={link.href}
                  className="hover:text-primary-500 dark:hover:text-primary-400 m-1 text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  {link.title}
                </Link>
              </span>
            ))}
          </div>
          <CustomSearch />
          <ThemeSwitch />
          <MobileNav />
        </div>
      </header>
    </div>
  )
}

export default Header
