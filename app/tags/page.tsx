import TagExplorer from '@/components/TagExplorer'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

// --- Category definitions -------------------------------------------------
// Tags are matched against these lists (exact match on the slugified tag key
// from tag-data.json, e.g. "Remote Code Execution" -> remote-code-execution).
// Anything that doesn't match a list, and doesn't match the CVE regex below,
// falls into "other" — if a tag lands there, add it to the right list here.
//
// Section order on the page: sections with the most tags come first, smaller
// sections last ("other" is always last). Ties keep the order of this array.
// Tags inside a section are sorted by post count (desc), then alphabetically,
// unless the category defines `order`, which pins an explicit order.

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
    label: 'web exploitation',
    tags: [
      'authentication-bypass',
      'file-upload',
      'unrestricted-file-upload',
      'local-file-inclusion',
      'path-traversal',
      'sql-injection',
      'idor',
      'filter-bypass',
      'virtual-host-routing',
      'git-dump',
    ],
  },
  {
    label: 'code execution',
    tags: [
      'remote-code-execution',
      'rce',
      'php-reverse-shell',
      'reverse-shell',
      'buffer-overflow',
      'sandbox-escape',
      'groovy-script',
    ],
  },
  {
    label: 'privilege escalation',
    tags: [
      'privilege-escalation',
      'sudo-misconfiguration',
      'suid',
      'linux-capabilities',
      'cap_setuid',
      'incron',
      'cron-job',
      'systemd-timer',
      'unquoted-service-path',
      'gtfobins',
    ],
  },
  {
    label: 'credentials & cracking',
    tags: [
      'hash-cracking',
      'zip-crack',
      'weak-credentials',
      'hardcoded-credentials',
      'plaintext-credentials',
      'password-reuse',
      'credential-leak',
      'environment-file-leak',
      'ssh-key',
      'anonymous-login',
    ],
  },
  {
    label: 'active directory attacks',
    tags: ['kerberoasting', 'ntlm', 'adcs', 'esc16', 'shadow-credentials'],
  },
  {
    label: 'cves & named exploits',
    tags: ['ms17-010', 'eternalblue', 'trans2open'],
  },
  {
    label: 'cms & web apps',
    tags: [
      'cms',
      'craft-cms',
      'backdrop-cms',
      'navigate-cms',
      'getsimple-cms',
      'nibbleblog',
      'boltwire',
      'krayin-crm',
      'freepbx',
      'jenkins',
      'jupyter',
      'gitea',
      'crushftp',
      'flask',
      'mcp-inspector',
      'backrest',
      'python-code-editor',
      'backysh',
    ],
  },
  {
    label: 'services & protocols',
    tags: [
      'ftp',
      'smb',
      'samba',
      'nfs',
      'telnet',
      'websocket',
      'mysql',
      'sqlite',
      'port-forwarding',
    ],
  },
  {
    label: 'tools',
    tags: [
      'metasploit',
      'msfvenom',
      'linpeas',
      'winpeas',
      'pspy',
      'bloodhound',
      'evil-winrm',
      'pcap-analysis',
      'restic',
      'npbackup-cli',
      'git-dumper',
    ],
  },
  {
    label: 'ai / ml',
    tags: ['machine-learning', 'tensorflow', 'keras-model-rce', 'pickle-deserialization'],
  },
  {
    label: 'languages & runtimes',
    tags: ['cpp', 'javascript', 'js2py', 'erlang', 'eshell'],
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

// Sections that describe *what kind of post* it is rather than *what it covers*.
// They are left out of the "most written about" leaderboard.
const META_SECTIONS = new Set([
  'content type',
  'challenge category',
  'source',
  'difficulty',
  'os & environment',
])

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
