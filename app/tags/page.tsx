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
// Tagging rules these lists assume (a post gets at most ~4 content tags):
//   - lowercase, short community shorthand (rce, sudo, auth-bypass), one tag per
//     concept. Keep tags short: they have to fit inside a hexagon on the web.
//   - tag the TARGET (OS / domain, product), the OUTCOME (rce, auth-bypass) and
//     the core bug class / technique (sudo, idor)
//   - the exact CVE ID is its own tag (matched by CVE_PATTERN, no generic "cve")
//   - no tool, recon-step or implied-service tags (metasploit, smb, nfs, telnet,
//     git-dump, writeup): if another tag on the post already implies it, drop it
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
// lib/difficulty.ts uses `machine` + `hackthebox` + the difficulty tag to draw
// the difficulty-coloured glow on post icons), but they are not useful as a
// filter (`machine` / `easy` are on almost every post), so the tags page
// doesn't list them.
const HIDDEN_TAGS = new Set([
  'machine',
  'challenge',
  'very-easy',
  'easy',
  'medium',
  'hard',
  'insane',
])

const CATEGORIES: Category[] = [
  {
    // Where the box or lab comes from
    label: 'source',
    tags: ['hackthebox', 'vulnhub', 'portswigger', 'tryhackme'],
  },
  {
    // The kind of challenge, for the non-machine posts (HTB challenge categories)
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
      'ai',
      'iot',
    ],
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
      'sql-injection',
      'auth-bypass',
      'access-control',
      'idor',
      'credential-leak',
      'weak-credentials',
      'anonymous-login',
      'esc16',
      'adcs',
      'kerberoasting',
      'ntlm',
      'sudo-misconfiguration',
      'authentication-bypass',
    ],
  },
  {
    label: 'privilege escalation',
    tags: ['sudo', 'suid', 'linux-capabilities', 'cron', 'unquoted-service-path'],
  },
  {
    // Exact CVE IDs are picked up by CVE_PATTERN below
    label: 'cves & exploits',
    tags: ['ms17-010', 'trans2open'],
  },
  {
    // What was attacked: the OS / domain, and the vulnerable product, service or library
    label: 'targets',
    tags: [
      'linux',
      'windows',
      'active-directory',
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
      'samba',
      'ftp',
      'websocket',
      'tensorflow',
      'js2py',
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

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  const sections = categorizeTags(Object.keys(tagCounts), tagCounts)

  return (
    <TagExplorer
      sections={sections.map(({ label, tags }) => ({ label, tags }))}
      counts={tagCounts}
    />
  )
}
