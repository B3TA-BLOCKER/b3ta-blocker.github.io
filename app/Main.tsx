'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import Image from 'next/image'
import NewsletterForm from '@/components/NewsletterForm'
import {
  hasSeenIntro,
  markIntroSeen,
  INTRO_PHASE_TWO_EVENT,
  INTRO_PENDING_ATTR,
} from '@/lib/introSequence'

const MAX_DISPLAY = 3

const HEADING_WHITE = "Bukhari's "
const HEADING_RED = 'Archive'
const TAGLINE = '# My journey through CTFs, labs, and everything in between.'
const COMMAND = 'ls ~/archive'

export default function Home({ posts }) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const headingWhiteRef = useRef<HTMLSpanElement>(null)
  const headingRedRef = useRef<HTMLSpanElement>(null)
  // The blinking cursor after the heading — hidden until typing starts
  const headingCursorRef = useRef<HTMLSpanElement>(null)
  const taglineRef = useRef<HTMLSpanElement>(null)
  // The $ before the command line — hidden until typing starts
  const commandDollarRef = useRef<HTMLSpanElement>(null)
  const commandRef = useRef<HTMLSpanElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  // The entire second prompt line ($  + blinking cursor) — hidden until output lands
  const promptLineRef = useRef<HTMLParagraphElement>(null)
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])
  const phaseTwoPlayedRef = useRef(false)

  // Controls whether cards start hidden (for the intro animation)
  const [cardsHidden, setCardsHidden] = useState(false)
  // Controls whether the whole hero block is hidden before the intro claims it
  const [heroHidden, setHeroHidden] = useState(false)

  useLayoutEffect(() => {
    if (hasSeenIntro()) {
      // Repeat visit — remove CSS guard, show everything as-is
      document.documentElement.removeAttribute(INTRO_PENDING_ATTR)
      return
    }

    let cancelled = false
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

    const typeInto = async (el: HTMLElement | null, text: string, speed = 32) => {
      if (!el) return
      el.textContent = ''
      for (const ch of text) {
        if (cancelled) return
        el.textContent += ch
        await sleep(speed)
      }
    }

    // --- Hide everything synchronously before the browser paints again ---
    // Use React state for the hero block — this is cleaner than poking
    // opacity on individual elements and avoids the 1-frame flash where
    // the CSS guard is lifted before JS hiding takes over.
    setHeroHidden(true)
    setCardsHidden(true)

    // Also zero out text nodes so they don't flash in if the CSS guard
    // lifts before the state update commits.
    if (headingWhiteRef.current) headingWhiteRef.current.textContent = ''
    if (headingRedRef.current) headingRedRef.current.textContent = ''
    if (taglineRef.current) taglineRef.current.textContent = ''
    if (commandRef.current) commandRef.current.textContent = ''

    // Now it's safe to drop the CSS pre-paint guard — our own state is
    // controlling visibility from this point on.
    document.documentElement.removeAttribute(INTRO_PENDING_ATTR)

    async function playPhaseTwo() {
      // Step 1 — reveal hero block, then badge glows in
      setHeroHidden(false)

      if (badgeRef.current) {
        badgeRef.current.style.opacity = '1'
        badgeRef.current.style.animation = 'badgeGlow 0.7s ease'
      }
      await sleep(400)
      if (cancelled) return

      // Step 2 — show the heading cursor and $ prompt now that typing is about to start
      if (headingCursorRef.current) headingCursorRef.current.style.opacity = '1'
      if (commandDollarRef.current) commandDollarRef.current.style.opacity = '1'

      // Step 3 — ALL typing starts at once: heading, tagline, and $ command in parallel
      const headingDone = (async () => {
        await typeInto(headingWhiteRef.current, HEADING_WHITE, 38)
        await typeInto(headingRedRef.current, HEADING_RED, 38)
      })()
      const taglineDone = typeInto(taglineRef.current, TAGLINE, 14)
      const commandDone = typeInto(commandRef.current, COMMAND, 45)

      await Promise.all([headingDone, taglineDone, commandDone])
      if (cancelled) return

      // Step 4 — output + second prompt land instantly (terminal behaviour)
      await sleep(250)
      if (cancelled) return

      if (outputRef.current) {
        outputRef.current.style.opacity = '1'
        outputRef.current.style.animation = 'introPop 0.4s cubic-bezier(.3,1.3,.4,1)'
      }
      if (promptLineRef.current) {
        promptLineRef.current.style.opacity = '1'
      }

      // Step 5 — blog cards slide in staggered
      await sleep(400)
      if (cancelled) return

      cardRefs.current.forEach((el, i) => {
        if (!el) return
        setTimeout(() => {
          if (cancelled) return
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }, i * 220)
      })

      markIntroSeen()
    }

    function onPhaseTwo() {
      if (phaseTwoPlayedRef.current) return
      phaseTwoPlayedRef.current = true
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
        {/*
          heroHidden wraps the entire hero block. When true (fresh session,
          before phase two fires) the whole section is invisible — no flash
          of pre-typed content, no orphan dollar signs or cursors visible
          while the header is still doing its handwriting animation.
        */}
        <div
          className="relative overflow-hidden pt-10 pb-8"
          style={heroHidden ? { opacity: 0 } : undefined}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Badge — always rendered, opacity driven by JS during intro */}
          <div
            ref={badgeRef}
            className="mb-5 inline-flex items-center rounded border-2 border-red-600/50 px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-red-700 dark:border-red-500/30 dark:text-red-500"
            style={heroHidden ? { opacity: 0 } : undefined}
          >
            Hack · Learn · Repeat
          </div>

          <h1 className="mb-5 font-sans text-5xl leading-tight font-bold tracking-tight text-gray-900 md:text-6xl dark:text-gray-100">
            <span ref={headingWhiteRef}>{HEADING_WHITE}</span>
            <span ref={headingRedRef} className="text-red-500">
              {HEADING_RED}
            </span>
            {/*
              Cursor is hidden (opacity 0) until typing begins — it would
              look wrong blinking at the end of an empty heading before
              the text arrives. Shown once commandDollar is shown in step 2.
            */}
            <span
              ref={headingCursorRef}
              className="ml-1 inline-block w-[3px] bg-red-500 align-middle"
              style={{ height: '1em', animation: 'blink 1s step-end infinite', opacity: 0 }}
            />
          </h1>

          <div className="font-mono text-lg leading-loose text-gray-900 dark:text-gray-400">
            <p className="text-lg text-gray-600 dark:text-gray-400/60">
              <span ref={taglineRef}>{TAGLINE}</span>
            </p>
            <p className="mt-1 font-bold">
              {/*
                The $ before `ls ~/archive` is hidden until typing begins —
                it would be a lone dollar sign sitting on screen before the
                command arrives. Shown in step 2 alongside headingCursor.
              */}
              <span
                ref={commandDollarRef}
                className="mr-2 text-red-600 dark:text-red-500"
                style={{ opacity: 0 }}
              >
                $
              </span>
              <span ref={commandRef} className="text-gray-900 dark:text-gray-100">
                {COMMAND}
              </span>
            </p>
            {/*
              Output div — hidden until the command finishes typing,
              then pops in instantly (introPop animation).
            */}
            <div
              ref={outputRef}
              className="mt-0.5 ml-4 grid grid-cols-3 gap-x-6 gap-y-0.5 font-bold text-green-700 dark:text-green-400"
              style={{ opacity: 0 }}
            >
              <span>htb-machines/</span>
              <span>challenges/</span>
              <span>dev-notes/</span>
            </div>
            {/*
              Second prompt line ($ + blinking cursor) — hidden until output
              lands. This is the "idle" cursor after the command runs.
            */}
            <p ref={promptLineRef} className="mt-1 font-bold" style={{ opacity: 0 }}>
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
