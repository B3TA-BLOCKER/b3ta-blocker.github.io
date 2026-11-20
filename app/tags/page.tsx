import TagExplorer from '@/components/TagExplorer'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

// --- Category definitions -------------------------------------------------
// Tags are matched against these lists (exact match on the slugified tag key
// from tag-data.json, e.g. "Remote Code Execution" -> remote-code-execution).
// Anything that doesn't match a list, isn't hidden and doesn't match the CVE
// regex below falls into "other" and prints a warning at build time — add it
// to the right list here.
//
// Tagging rules these lists assume (keep posts to ~5-8 tags):
//   - lowercase, short community shorthand (rce, lpe), one tag per concept
//   - tag the TARGET (platform, product), the OUTCOME (rce, auth bypass) and
//     the core bug class / technique (sudo-misconfiguration, idor)
//   - the exact CVE ID is its own tag (matched by CVE_PATTERN, no generic "cve")
//   - no tool, recon-step or format tags (metasploit, linpeas, git-dump, writeup)
//   - merged on purpose: credential-leak (plaintext / hardcoded / leaked
//     credentials), cron (cron, incron, systemd timers), rce, file-upload,
//     ms17-010 (not also "eternalblue")
//
// Section order on the page: sections with the most tags come first, smaller
// sections last ("other" is always last). Ties keep the order of this array.
// Tags inside a section are sorted by post count (desc), then alphabetically,
// unless the category defines `order`, which pins an explicit order.

type Category = { label: string; tags: string[]; order?: boolean }

// Structural tags. They stay on the posts because the site reads them (e.g.
// lib/difficulty.ts uses `machine` + `hackthebox` to decide which post icons
// get the difficulty-coloured glow), but they are not useful as a filter
// (`machine` is on almost every post), so the tags page doesn't list them.
const HIDDEN_TAGS = new Set(['machine', 'challenge'])

const CATEGORIES: Category[] = [
  {
    label: 'platform & type',
    tags: [
      'linux',
      'windows',
      'active-directory',
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
    tags: ['hackthebox', 'vulnhub', 'portswigger'],
  },
  {
    label: 'difficulty',
    tags: ['very-easy', 'easy', 'medium', 'hard', 'insane'],
    order: true, // keep this exact order, not count-based
  },
  {
    // What went wrong in the target: bug classes, misconfigurations, AD attacks
    label: 'vulnerabilities',
    tags: [
      'rce',
      'sandbox-escape',
      'buffer-overflow',
      'deserialization',
      'file-upload',
      'local-file-inclusion',
      'path-traversal',
      'sql-injection',
      'authentication-bypass',
      'access-control',
      'idor',
      'parameter-tampering',
      'credential-leak',
      'weak-credentials',
      'anonymous-login',
      'shadow-credentials',
      'esc16',
      'adcs',
      'kerberoasting',
      'ntlm',
    ],
  },
  {
    label: 'privilege escalation',
    tags: ['sudo-misconfiguration', 'suid', 'linux-capabilities', 'cron', 'unquoted-service-path'],
  },
  {
    // Exact CVE IDs are picked up by CVE_PATTERN below
    label: 'cves & exploits',
    tags: ['ms17-010', 'trans2open'],
  },
  {
    // The vulnerable product, service or library a post is about
    label: 'targets',
    tags: [
      'craft-cms',
      'backdrop-cms',
      'navigate-cms',
      'getsimple-cms',
      'nibbleblog',
      'boltwire',
      'krayin-crm',
      'freepbx',
      'jenkins',
      'crushftp',
      'mcp-inspector',
      'backrest',
      'smb',
      'samba',
      'nfs',
      'telnet',
      'ftp',
      'websocket',
      'tensorflow',
      'js2py',
      'cpp',
      'erlang',
      'javascript',
    ],
  },
]

const CVE_PATTERN = /^cve-\d{4}-\d+$/i
const CVE_LABEL = 'cves & exploits'

function categorizeTags(tagKeys: string[], tagCounts: Record<string, number>) {
  const remaining = new Set(tagKeys.filter((t) => !HIDDEN_TAGS.has(t)))
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
    // Surfaces in `next build` / dev logs so new tags get a category on purpose
    console.warn(
      `[tags] ${remaining.size} tag(s) have no category and fall into "other": ${Array.from(remaining).join(', ')}`
    )
    const other = Array.from(remaining).sort(
      (a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b)
    )
    result.push({ label: 'other', tags: other })
  }

  return result
}

// Sections that describe *what kind of post* it is rather than *what it covers*.
// They are left out of the "most written about" leaderboard.
const META_SECTIONS = new Set(['platform & type', 'source', 'difficulty'])

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  const sections = categorizeTags(Object.keys(tagCounts), tagCounts)

  const top = sections
    .filter((s) => !META_SECTIONS.has(s.label))
    .flatMap((s) => s.tags)
    .sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b))
    .slice(0, 6)

  return (
    <TagExplorer
      sections={sections.map(({ label, tags }) => ({ label, tags }))}
      counts={tagCounts}
      top={top}
    />
  )
}
