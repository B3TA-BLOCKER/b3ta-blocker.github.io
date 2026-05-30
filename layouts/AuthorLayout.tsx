import { ReactNode } from 'react'
import type { Authors } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'

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

          <div className="relative flex items-start justify-between gap-8">

            {/* Left — text content */}
            <div className="flex-1">

              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded border border-red-500/30 px-3 py-1 font-mono text-[11px] tracking-widest text-red-500">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-red-500"
                  style={{ animation: 'dotglow 1.4s ease-in-out infinite' }}
                />
                Cybersecurity Graduate — Open to Work
              </div>

              {/* Title */}
              <h1 className="mb-5 font-sans text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 md:text-6xl">
                Hassaan Ali <span className="text-red-500">Bukhari</span>
                <span
                  className="ml-1 inline-block w-[3px] bg-red-500 align-middle"
                  style={{ height: '0.75em', animation: 'blink 1s step-end infinite' }}
                />
              </h1>

              {/* Terminal block */}
              <div className="font-mono text-sm leading-loose text-gray-500 dark:text-gray-400">
                <p className="opacity-60"># B3TA-BLOCKER</p>
                <p className="mt-1">
                  <span className="mr-2 text-red-500">$</span>
                  <span className="text-gray-900 dark:text-gray-100">cat identity.txt</span>
                </p>
                <div className="ml-4 mt-0.5 space-y-0.5">
                  <p>
                    <span className="text-green-500 dark:text-green-400">role</span>
                    <span className="mx-2">:</span>
                    Red Teamer · CTF Player · Binary Exploitation Enthusiast
                  </p>
                  <p>
                    <span className="text-green-500 dark:text-green-400">status</span>
                    <span className="mx-2">:</span>
                    Self-taught · Graduated · Job hunting
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
                    style={{ height: '0.75em', animation: 'blink 1s step-end infinite' }}
                  />
                </p>
              </div>

            </div>

            {/* Right — avatar + info */}
            <div className="flex flex-col items-center gap-3 pt-2 shrink-0">
              {avatar && (
                <div className="relative">
                  <Image
                    src={avatar}
                    alt="avatar"
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-full border-2 border-red-500/30"
                  />
                  <div
                    className="absolute inset-[-5px] rounded-full border border-red-500/20"
                    style={{ animation: 'blink 3s ease infinite' }}
                  />
                </div>
              )}
              <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {name}
              </h3>
              <div className="font-mono text-[11px] tracking-widest text-red-500">
                // {occupation}
              </div>
              <div className="flex space-x-3 pt-2">
                <SocialIcon kind="mail" href={`mailto:${email}`} />
                <SocialIcon kind="github" href={github} />
                <SocialIcon kind="linkedin" href={linkedin} />
                <SocialIcon kind="x" href={twitter} />
                <SocialIcon kind="bluesky" href={bluesky} />
              </div>
            </div>

          </div>
        </div>

        {/* Content below */}
        <div className="prose dark:prose-invert max-w-none pt-8 pb-8">
          {children}
        </div>

      </div>
    </>
  )
}
