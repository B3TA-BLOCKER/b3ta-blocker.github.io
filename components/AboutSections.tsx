import {
  skills,
  experience,
  education,
  certifications,
  projects,
  community,
} from '@/data/aboutContent'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-8 flex items-baseline gap-3">
      <span className="font-mono text-lg text-red-500" aria-hidden="true">
        —
      </span>
      <span className="font-sans text-2xl font-bold tracking-tight text-gray-100 md:text-3xl">
        {children}
      </span>
    </h2>
  )
}

type SkillCategory = {
  name: string
  items: string[]
  colorClass: string
}

function SkillsTree({ categories }: { categories: SkillCategory[] }) {
  return (
    <div className="overflow-x-auto font-mono text-base leading-relaxed whitespace-pre">
      <div className="mb-2">
        <span className="mr-2 font-bold text-red-600 dark:text-red-500">$</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">tree ~/skills</span>
      </div>
      {categories.map((cat, ci) => {
        const isLastCat = ci === categories.length - 1
        const catConnector = isLastCat ? '└── ' : '├── '
        const childPrefix = isLastCat ? '    ' : '│   '
        return (
          <div key={cat.name}>
            <div>
              <span className="text-gray-600">{catConnector}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{cat.name}/</span>
            </div>
            {cat.items.map((item, ii) => {
              const isLastItem = ii === cat.items.length - 1
              const itemConnector = isLastItem ? '└── ' : '├── '
              return (
                <div key={item}>
                  <span className="text-gray-600">
                    {childPrefix}
                    {itemConnector}
                  </span>
                  <span className={cat.colorClass}>{item}</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function TimelineItem({
  date,
  role,
  org,
  href,
  note,
  bullets,
}: {
  date: string
  role: string
  org?: string
  href?: string
  note?: string
  bullets?: string[]
}) {
  return (
    <div className="relative border-l border-gray-800 pl-6">
      <span className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full bg-green-500" />
      <div className="mb-1 font-mono text-sm text-gray-500">{date}</div>
      <h3 className="text-xl font-bold text-gray-100">
        {role}
        {org &&
          (href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal text-gray-400 hover:text-red-400"
            >
              {' '}
              · {org}
            </a>
          ) : (
            <span className="font-normal text-gray-400"> · {org}</span>
          ))}
      </h3>
      {note && <p className="mt-1 text-base text-gray-500">{note}</p>}
      {bullets && (
        <ul className="mt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-base leading-relaxed text-gray-400">
              <span className="mt-0.5 text-red-500">›</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AboutMiddleContent() {
  return (
    <>
      <section className="mb-14">
        <SectionHeading>Skills</SectionHeading>
        <SkillsTree
          categories={[
            {
              name: 'languages',
              items: skills.languages,
              colorClass: 'text-gray-900 dark:text-gray-200',
            },
            {
              name: 'tools',
              items: skills.tools,
              colorClass: 'text-green-700 dark:text-green-400',
            },
            {
              name: 'platforms',
              items: skills.platforms,
              colorClass: 'text-red-600 dark:text-red-400',
            },
          ]}
        />
      </section>

      <section className="mb-14">
        <SectionHeading>Experience</SectionHeading>
        <div className="space-y-10">
          {experience.map((e, i) => (
            <TimelineItem key={i} {...e} />
          ))}
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
              className="inline-flex items-center gap-2 rounded border border-yellow-600/30 bg-yellow-600/5 px-4 py-2 font-mono text-base text-yellow-500"
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
              className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/40"
            >
              <div className="flex items-center gap-1.5 border-b border-gray-800 bg-gray-900/60 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 font-mono text-xs text-gray-500">{p.file}</span>
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-100">{p.name}</h3>
                  <span className="shrink-0 font-mono text-xs text-gray-600">{p.tag}</span>
                </div>
                <p className="mb-3 text-base leading-relaxed text-gray-400">{p.desc}</p>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-sm text-red-500 hover:text-red-400"
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
              className="flex flex-col gap-0.5 border-b border-gray-900 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <div>
                <span className="text-lg font-bold text-gray-100">{c.role}</span>
                <span className="text-gray-500"> · {c.org}</span>
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
