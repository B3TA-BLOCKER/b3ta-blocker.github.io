import Link from '@/components/Link'
import { slug } from 'github-slugger'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

// --- Category definitions -------------------------------------------------
// Tags are matched against these lists (exact match on the raw tag key from
// tag-data.json). Anything that doesn't match a list, and doesn't match the
// CVE regex below, falls into "Other".

const CATEGORIES: { label: string; tags: string[] }[] = [
  {
    label: 'vulnerability classes',
    tags: [
      'privilege-escalation',
      'sudo-exploitation',
      'rce',
      'sql-injection',
      'lfi',
      'path-traversal',
      'file-upload',
      'sandbox-escape',
      'python-sandbox-escape',
      'lateral-movement',
      'credential-reuse',
      'reverse-shell',
      'suid',
      'incron',
      'virtual-host',
      'web-exploitation',
      'malicious-model',
    ],
  },
  {
    label: 'cves & named exploits',
    tags: ['ms17-010', 'eternalblue'],
  },
  {
    label: 'platforms',
    tags: ['linux', 'windows', 'active-directory'],
  },
  {
    label: 'tools & targets',
    tags: [
      'hackthebox',
      'machine',
      'vulnhub',
      'metasploit',
      'jenkins',
      'jupyter',
      'mcp',
      'git-dumper',
      'boltwire',
      'freepbx',
      'tensorflow',
      'javascript',
      'js2py',
      'cpp',
      'coding',
      'challenge',
    ],
  },
  {
    label: 'difficulty',
    tags: ['easy', 'medium', 'hard', 'very-easy'],
  },
]

const CVE_PATTERN = /^cve-\d{4}-\d+$/i

function categorizeTags(tagKeys: string[]) {
  const remaining = new Set(tagKeys)
  const sections: { label: string; tags: string[] }[] = []

  for (const category of CATEGORIES) {
    const matched = category.tags.filter((t) => remaining.has(t))
    matched.forEach((t) => remaining.delete(t))
    if (matched.length > 0) {
      sections.push({ label: category.label, tags: matched })
    }
  }

  const cveMatches = Array.from(remaining).filter((t) => CVE_PATTERN.test(t))
  if (cveMatches.length > 0) {
    const cveSection = sections.find((s) => s.label === 'cves & named exploits')
    if (cveSection) {
      cveSection.tags.push(...cveMatches)
    } else {
      sections.push({ label: 'cves & named exploits', tags: cveMatches })
    }
    cveMatches.forEach((t) => remaining.delete(t))
  }

  if (remaining.size > 0) {
    sections.push({ label: 'other', tags: Array.from(remaining) })
  }

  return sections
}

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sections = categorizeTags(tagKeys)

  // Sort tags within each section by post count, descending
  sections.forEach((s) => s.tags.sort((a, b) => tagCounts[b] - tagCounts[a]))

  return (
    <div className="md:mt-24">
      <div className="space-x-2 pt-6 pb-10">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Tags
        </h1>
      </div>
      {tagKeys.length === 0 && <p className="pt-10 text-gray-500">No tags found.</p>}

      <div className="space-y-10 pb-16">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-4 font-mono text-xs tracking-widest text-gray-500 uppercase dark:text-gray-500">
              <span className="text-primary-500">#</span> {section.label}
            </p>
            <div className="flex flex-wrap gap-3">
              {section.tags.map((t) => (
                <Link
                  key={t}
                  href={`/tags/${slug(t)}`}
                  aria-label={`View posts tagged ${t}`}
                  className="group border-primary-900/40 hover:border-primary-500 hover:bg-primary-500/5 flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-sm transition-colors dark:border-gray-800"
                >
                  <span className="text-primary-500 uppercase">{t.split(' ').join('-')}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-600">{tagCounts[t]}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
