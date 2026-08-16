'use client'

import { useEffect, useRef, useState } from 'react'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import Image from 'next/image'
import NewsletterForm from '@/components/NewsletterForm'
import { hasSeenIntro, markIntroSeen, INTRO_PHASE_TWO_EVENT } from '@/lib/introSequence'

const MAX_DISPLAY = 3

const HEADING_WHITE = "Bukhari's "
const HEADING_RED = 'Archive'
const TAGLINE = '# My journey through CTFs, labs, and everything in between.'
const COMMAND = 'ls ~/archive'

export default function Home({ posts }) {
  // Refs for everything the intro sequence types/reveals. The JSX below
  // always renders the real, final content (server-safe, no-JS-safe) — the
  // effect only ever *temporarily* clears/hides it for a fresh session,
  // then plays it back in.
  const badgeRef = useRef<HTMLDivElement>(null)
  const headingWhiteRef = useRef<HTMLSpanElement>(null)
  const headingRedRef = useRef<HTMLSpanElement>(null)
  const taglineRef = useRef<HTMLSpanElement>(null)
  const commandRef = useRef<HTMLSpanElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const promptLineRef = useRef<HTMLParagraphElement>(null)
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])

  const [cardsHidden, setCardsHidden] = useState(false)

  useEffect(() => {
    if (hasSeenIntro()) return // repeat visit this session — leave everything as server-rendered

    let cancelled = false
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const typeInto = async (el: HTMLElement | null, text: string, speed = 32) => {
      if (!el) return
      el.textContent = ''
      for (const ch of text) {
        if (cancelled) return
        el.textContent += ch
        await sleep(speed)
      }
    }

    // Hide everything this sequence controls, right up front, before the
    // browser paints again — Header is still tracing the handwritten line
    // and glowing the nav in at this point.
    if (badgeRef.current) badgeRef.current.style.opacity = '0'
    if (headingWhiteRef.current) headingWhiteRef.current.textContent = ''
    if (headingRedRef.current) headingRedRef.current.textContent = ''
    if (taglineRef.current) taglineRef.current.textContent = ''
    if (commandRef.current) commandRef.current.textContent = ''
    if (outputRef.current) outputRef.current.style.opacity = '0'
    if (promptLineRef.current) promptLineRef.current.style.opacity = '0'
    setCardsHidden(true)

    async function playPhaseTwo() {
      if (badgeRef.current) {
        badgeRef.current.style.opacity = '1'
        badgeRef.current.style.animation = 'badgeGlow 0.7s ease'
      }
      await sleep(500)

      await typeInto(headingWhiteRef.current, HEADING_WHITE, 38)
      await typeInto(headingRedRef.current, HEADING_RED, 38)
      await sleep(200)

      await typeInto(taglineRef.current, TAGLINE, 14)
      await sleep(250)

      await typeInto(commandRef.current, COMMAND, 45)
      await sleep(350)
      if (cancelled) return

      // Real terminal behavior: output and the next prompt land together, instantly.
      if (outputRef.current) {
        outputRef.current.style.opacity = '1'
        outputRef.current.style.animation = 'introPop 0.4s cubic-bezier(.3,1.3,.4,1)'
      }
      if (promptLineRef.current) {
        promptLineRef.current.style.opacity = '1'
      }
      await sleep(500)
      if (cancelled) return

      cardRefs.current.forEach((el, i) => {
        if (!el) return
        setTimeout(() => {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }, i * 220)
      })

      markIntroSeen()
    }

    function onPhaseTwo() {
      playPhaseTwo()
    }
    window.addEventListener(INTRO_PHASE_TWO_EVENT, onPhaseTwo)
    return () => {
      cancelled = true
      window.removeEventListener(INTRO_PHASE_TWO_EVENT, onPhaseTwo)
    }
  }, [])

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
          <div
            ref={badgeRef}
            className="mb-5 inline-flex items-center rounded border-2 border-red-600/50 px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-red-700 dark:border-red-500/30 dark:text-red-500"
          >
            Hack · Learn · Repeat
          </div>
          <h1 className="mb-5 font-sans text-5xl leading-tight font-bold tracking-tight text-gray-900 md:text-6xl dark:text-gray-100">
            <span ref={headingWhiteRef}>{HEADING_WHITE}</span>
            <span ref={headingRedRef} className="text-red-500">
              {HEADING_RED}
            </span>
            <span
              className="ml-1 inline-block w-[3px] bg-red-500 align-middle"
              style={{ height: '1em', animation: 'blink 1s step-end infinite' }}
            />
          </h1>
          <div className="font-mono text-lg leading-loose text-gray-900 dark:text-gray-400">
            <p className="text-lg text-gray-600 dark:text-gray-400/60">
              <span ref={taglineRef}>{TAGLINE}</span>
            </p>
            <p className="mt-1 font-bold">
              <span className="mr-2 text-red-600 dark:text-red-500">$</span>
              <span ref={commandRef} className="text-gray-900 dark:text-gray-100">
                {COMMAND}
              </span>
            </p>
            <div
              ref={outputRef}
              className="mt-0.5 ml-4 grid grid-cols-3 gap-x-6 gap-y-0.5 font-bold text-green-700 dark:text-green-400"
            >
              <span>htb-machines/</span>
              <span>challenges/</span>
              <span>dev-notes/</span>
            </div>
            <p ref={promptLineRef} className="mt-1 font-bold">
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
          {posts.slice(0, MAX_DISPLAY).map((post, i) => {
            const { slug, date, title, summary, tags, images, locked } = post
            return (
              <li
                key={slug}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className="py-12"
                style={
                  cardsHidden
                    ? {
                        opacity: 0,
                        transform: 'translateY(14px)',
                        transition: 'opacity .55s ease, transform .55s ease',
                      }
                    : undefined
                }
              >
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
