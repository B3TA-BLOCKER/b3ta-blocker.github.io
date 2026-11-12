import {
  intro,
  skills,
  experience,
  education,
  certifications,
  projects,
  community,
} from '@/data/aboutContent'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 flex items-center gap-3 font-mono text-lg tracking-widest text-red-500 uppercase">
      <span aria-hidden="true">—</span>
      {children}
    </h2>
  )
}

function Tag({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode
  tone?: 'gray' | 'green' | 'red'
}) {
  const tones = {
    gray: 'border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-200',
    green:
      'border-green-600/40 bg-green-600/5 text-green-700 dark:border-green-500/30 dark:bg-green-500/5 dark:text-green-400',
    red: 'border-red-600/40 bg-red-600/5 text-red-700 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-400',
  }
  return (
    <span className={`rounded border px-4 py-1.5 font-mono text-base ${tones[tone]}`}>
      {children}
    </span>
  )
}

type TimelineEntry = {
  date: string
  role: string
  org?: string
  href?: string
  note?: string
  bullets?: string[]
}

// A role counts as the current one when its date range ends in "Present".
const isCurrent = (date: string) => /\bpresent\b/i.test(date)

// Timeline dot: solid green for the current role, hollow ring for past ones.
function TimelineDot({ current, className }: { current: boolean; className: string }) {
  return (
    <span
      className={`absolute h-2.5 w-2.5 rounded-full ${className} ${
        current ? 'bg-green-500' : 'border-2 border-green-500 bg-white dark:bg-gray-950'
      }`}
    />
  )
}

// "Role · Company" — the company (when given) is a grey link, like on every other entry.
function RoleHeading({ role, org, href }: { role: string; org?: string; href?: string }) {
  return (
    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
      {role}
      {org &&
        (href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-normal text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            {' '}
            · {org}
          </a>
        ) : (
          <span className="font-normal text-gray-600 dark:text-gray-400"> · {org}</span>
        ))}
    </h3>
  )
}

function RoleDetails({ note, bullets }: { note?: string; bullets?: string[] }) {
  return (
    <>
      {note && <p className="mt-1 text-base text-gray-600 dark:text-gray-500">{note}</p>}
      {bullets && (
        <ul className="mt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-2 text-base leading-relaxed text-gray-700 dark:text-gray-400"
            >
              <span className="mt-0.5 text-red-500">›</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function TimelineItem({
  date,
  role,
  org,
  href,
  note,
  bullets,
  current = true,
}: TimelineEntry & { current?: boolean }) {
  return (
    <div className="relative border-l border-gray-300 pl-6 dark:border-gray-800">
      <TimelineDot current={current} className="top-1.5 -left-[5px]" />
      <div className="mb-1 font-mono text-sm text-gray-500">{date}</div>
      <RoleHeading role={role} org={org} href={href} />
      <RoleDetails note={note} bullets={bullets} />
    </div>
  )
}

// LinkedIn-style grouping: consecutive entries at the same organisation are merged
// into one connected timeline. Entries with no org, or a different org, stay separate.
function groupByOrg(entries: TimelineEntry[]) {
  const groups: { org?: string; href?: string; roles: TimelineEntry[] }[] = []
  for (const e of entries) {
    const last = groups[groups.length - 1]
    if (last && e.org && last.org === e.org) {
      last.roles.push(e)
      last.href = last.href ?? e.href
    } else {
      groups.push({ org: e.org, href: e.href, roles: [e] })
    }
  }
  return groups
}

// Several roles at one company: one continuous line, tighter spacing, and the company
// name is shown only on the first (newest) role.
function GroupedTimelineItem({
  org,
  href,
  roles,
}: {
  org: string
  href?: string
  roles: TimelineEntry[]
}) {
  return (
    <div className="relative space-y-7 border-l border-gray-300 pl-6 dark:border-gray-800">
      {roles.map((r, i) => (
        <div key={i} className="relative">
          <TimelineDot current={isCurrent(r.date)} className="top-1.5 -left-[29px]" />
          <div className="mb-1 font-mono text-sm text-gray-500">{r.date}</div>
          <RoleHeading role={r.role} org={i === 0 ? org : undefined} href={href} />
          <RoleDetails note={r.note} bullets={r.bullets} />
        </div>
      ))}
    </div>
  )
}

export function AboutMiddleContent() {
  return (
    <>
      <section className="mb-14">
        <h1 className="mb-5 font-sans text-3xl leading-tight font-bold tracking-tight text-gray-900 md:text-4xl dark:text-gray-100">
          I&apos;m <span className="text-red-500">{intro.handle}</span>
        </h1>
        <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{intro.bio}</p>
      </section>

      <section className="mb-14">
        <SectionHeading>Skills</SectionHeading>
        <div className="space-y-5">
          <div>
            <div className="mb-2 font-mono text-sm text-gray-600">languages</div>
            <div className="flex flex-wrap gap-2">
              {skills.languages.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 font-mono text-sm text-gray-600">tools &amp; frameworks</div>
            <div className="flex flex-wrap gap-2">
              {skills.tools.map((s) => (
                <Tag key={s} tone="green">
                  {s}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 font-mono text-sm text-gray-600">platforms</div>
            <div className="flex flex-wrap gap-2">
              {skills.platforms.map((s) => (
                <Tag key={s} tone="red">
                  {s}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <SectionHeading>Experience</SectionHeading>
        <div className="space-y-10">
          {groupByOrg(experience as TimelineEntry[]).map((g, i) =>
            g.roles.length > 1 && g.org ? (
              <GroupedTimelineItem key={i} org={g.org} href={g.href} roles={g.roles} />
            ) : (
              <TimelineItem key={i} {...g.roles[0]} current={isCurrent(g.roles[0].date)} />
            )
          )}
        </div>
      </section>

      <section className="mb-14">
        <SectionHeading>Education</SectionHeading>
        <div className="space-y-10">
          {education.map((e, i) => (
            <TimelineItem key={i} {...e} />
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionHeading>Certifications</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {certifications.map((c) => (
            <div
              key={c.name}
              className="inline-flex items-center gap-2 rounded border border-yellow-600/40 bg-yellow-600/5 px-4 py-2 font-mono text-base text-yellow-700 dark:border-yellow-600/30 dark:text-yellow-500"
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {c.name} — {c.issuer}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionHeading>Projects</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.file}
              className="overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-900/40"
            >
              <div className="flex items-center gap-1.5 border-b border-gray-300 bg-gray-100 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 font-mono text-xs text-gray-500">{p.file}</span>
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{p.name}</h3>
                  <span className="shrink-0 font-mono text-xs text-gray-600">{p.tag}</span>
                </div>
                <p className="mb-3 text-base leading-relaxed text-gray-700 dark:text-gray-400">
                  {p.desc}
                </p>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                >
                  view project
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6" />
                    <path d="M10 14 21 3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>Community</SectionHeading>
        <div className="space-y-4">
          {community.map((c, i) => (
            <div
              key={i}
              className="flex flex-col gap-0.5 border-b border-gray-200 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between dark:border-gray-900"
            >
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{c.role}</span>
                <span className="text-gray-600 dark:text-gray-500"> · {c.org}</span>
                {c.note && <p className="text-base text-gray-600">{c.note}</p>}
              </div>
              <span className="shrink-0 font-mono text-sm text-gray-600">{c.date}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
