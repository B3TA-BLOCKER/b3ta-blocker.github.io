import { ReactNode } from 'react'
import type { Authors } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'
import TerminalWrapper from '@/components/TerminalWrapper'

interface Props {
  children: ReactNode
  content: Omit<Authors, '_id' | '_raw' | 'body'>
}

export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, company, email, twitter, bluesky, linkedin, github } = content

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">

        {/* Hero Section */}
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

          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded border border-red-500/30 px-4 py-1.5 font-mono text-[13px] tracking-widest text-red-500">
            <span
              className="h-2 w-2 rounded-full bg-red-500"
              style={{ animation: 'dotglow 1.4s ease-in-out infinite' }}
            />
            Cybersecurity Graduate.
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-10">

            {/* Left — avatar + socials */}
            <div className="flex w-full shrink-0 flex-col items-center gap-3 md:w-auto">
              {avatar && (
                <div className="relative">
                  <Image
                    src={avatar}
                    alt="avatar"
                    width={160}
                    height={160}
                    className="h-[160px] w-[160px] rounded-full border-2 border-green-500/30 md:h-[190px] md:w-[190px]"
                  />
                  <div
                    className="absolute inset-[-5px] rounded-full border border-green-500/40"
                    style={{ animation: 'blink 3s ease infinite' }}
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <div className="scale-75">
                  <SocialIcon kind="mail" href={`mailto:${email}`} />
                </div>
                <div className="scale-75">
                  <SocialIcon kind="github" href={github} />
                </div>
                <div className="scale-75">
                  <SocialIcon kind="linkedin" href={linkedin} />
                </div>
                <div className="scale-75">
                  <SocialIcon kind="x" href={twitter} />
                </div>
                <div className="scale-75">
                  <SocialIcon kind="bluesky" href={bluesky} />
                </div>
              </div>
            </div>

            {/* Right — text */}
            <div className="w-full flex-1 text-center md:text-left">
              <h1 className="mb-5 font-sans text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl md:text-5xl xl:text-6xl">
                Hassaan Ali <span className="text-red-500">Bukhari</span>
                <span
                  className="ml-1 inline-block w-[3px] bg-red-500 align-middle"
                  style={{ height: '1em', animation: 'blink 1s step-end infinite' }}
                />
              </h1>

              <div className="font-mono text-sm leading-loose text-gray-500 dark:text-gray-400">
                <p className="opacity-60"># B3TA-BLOCKER</p>
                <p className="mt-1">
                  <span className="mr-2 text-red-500">$</span>
                  <span className="text-gray-900 dark:text-gray-100">cat identity.txt</span>
                </p>
                <div className="ml-4 mt-0.5 space-y-0.5 text-left">
                  <p>
                    <span className="text-green-500 dark:text-green-400">role</span>
                    <span className="mx-2">:</span>
                    Red Teamer · CTF Player · Binary Exploitation Enthusiast
                  </p>
                  <p>
                    <span className="text-green-500 dark:text-green-400">status</span>
                    <span className="mx-2">:</span>
                    Self-taught · Graduated
                  </p>
                  <p>
                    <span className="text-green-500 dark:text-green-400">passion</span>
                    <span className="mx-2">:</span>
                    Breaking things · Pentesting · Hacking
                  </p>
                </div>
                <p className="mt-1">
                  <span className="mr-2 text-red-500">$</span>
                  <span
                    className="inline-block w-[3px] bg-red-500 align-middle"
                    style={{ height: '1em', animation: 'blink 1s step-end infinite' }}
                  />
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Content below */}
        <div className="prose dark:prose-invert max-w-none pt-8 pb-8">
          {children}
        </div>

        {/* Terminal */}
        <div className="not-prose pt-8 pb-8">
          <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-red-500">
            — Terminal
          </h2>
          <TerminalWrapper />
        </div>

      </div>
    </>
  )
}
