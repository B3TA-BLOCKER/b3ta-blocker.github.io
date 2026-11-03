import Link from '@/components/Link'
import { slug } from 'github-slugger'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

// --- Category definitions -------------------------------------------------
// Tags are matched against these lists (exact match on the raw tag key from
// tag-data.json). Anything that doesn't match a list, and doesn't match the
// CVE regex below, falls into "other".
//
// Section order on the page: sections with the most tags come first, smaller
// sections last ("other" is always last). Ties keep the order of this array.
// Tags inside a section are sorted by post count (desc), then alphabetically,
// unless the category defines `order`, which pins an explicit order.
//
// Legacy/duplicate tags (eternalblue, python-sandbox-escape, js2py, git,
// sql-database) are still mapped so the page stays clean until the posts are
// retagged. Once retagged, they can be deleted from these lists.

type Category = { label: string; tags: string[]; order?: boolean }

const CATEGORIES: Category[] = [
  {
    label: 'content type',
    tags: ['machine', 'challenge', 'room'],
  },
  {
    label: 'challenge category',
    tags: [
      'coding',
      'pwn',
      'crypto',
      'forensics',
      'reverse-engineering',
      'steganography',
      'osint',
      'misc',
    ],
  },
  {
    label: 'source',
    tags: ['hackthebox', 'vulnhub'],
  },
  {
    label: 'difficulty',
    tags: ['very-easy', 'easy', 'medium', 'hard', 'insane'],
    order: true, // keep this exact order, not count-based
  },
  {
    label: 'os & environment',
    tags: ['linux', 'windows', 'active-directory'],
  },
  {
    label: 'web',
    tags: [
      'web-exploitation',
      'sql-injection',
      'lfi',
      'path-traversal',
      'file-upload',
      'idor',
      'virtual-host',
    ],
  },
  {
    label: 'privilege escalation',
    tags: ['privilege-escalation', 'sudo-exploitation', 'suid', 'incron', 'linux-capabilities'],
  },
  {
    label: 'exploitation & access',
    tags: [
      'rce',
      'reverse-shell',
      'sandbox-escape',
      'python-sandbox-escape',
      'lateral-movement',
      'credential-reuse',
    ],
  },
  {
    label: 'cves & named exploits',
    tags: ['ms17-010', 'eternalblue'],
  },
  {
    label: 'software & targets',
    tags: ['jenkins', 'jupyter', 'freepbx', 'boltwire', 'krayin-crm', 'craftcms', 'sql-database'],
  },
  {
    label: 'tools',
    tags: ['metasploit', 'git-dumper', 'git'],
  },
  {
    label: 'ai / ml',
    tags: ['tensorflow', 'malicious-model', 'mcp'],
  },
  {
    label: 'languages & services',
    tags: ['javascript', 'js2py', 'cpp', 'telnet'],
  },
]

const CVE_PATTERN = /^cve-\d{4}-\d+$/i
const CVE_LABEL = 'cves & named exploits'

function categorizeTags(tagKeys: string[], tagCounts: Record<string, number>) {
  const remaining = new Set(tagKeys)
  const sections: { label: string; tags: string[]; order?: boolean }[] = []

  for (const category of CATEGORIES) {
    const matched = category.tags.filter((t) => remaining.has(t))
    matched.forEach((t) => remaining.delete(t))
    sections.push({ label: category.label, tags: matched, order: category.order })
  }

  // CVE tags are matched by pattern so new ones are picked up automatically
  const cveMatches = Array.from(remaining).filter((t) => CVE_PATTERN.test(t))
  cveMatches.forEach((t) => remaining.delete(t))
  const cveSection = sections.find((s) => s.label === CVE_LABEL)
  if (cveSection) cveSection.tags.push(...cveMatches)

  // Count desc, then alphabetical; sections with `order` keep their listed order
  sections.forEach((s) => {
    if (s.order) return
    s.tags.sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b))
  })

  // Drop empty sections, then put the biggest sections first.
  // Array.prototype.sort is stable, so ties keep CATEGORIES order.
  const result = sections
    .filter((s) => s.tags.length > 0)
    .sort((a, b) => b.tags.length - a.tags.length)

  if (remaining.size > 0) {
    const other = Array.from(remaining).sort(
      (a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b)
    )
    result.push({ label: 'other', tags: other })
  }

  return result
}

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sections = categorizeTags(tagKeys, tagCounts)

  return (
    <div>
      <div className="space-y-2 pt-6 pb-8">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Tags
        </h1>
      </div>
      {tagKeys.length === 0 && <p className="pt-10 text-gray-500">No tags found.</p>}

      <div className="space-y-10 pb-16">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-4 font-mono text-base font-semibold tracking-widest text-gray-700 uppercase sm:text-lg dark:text-gray-300">
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
