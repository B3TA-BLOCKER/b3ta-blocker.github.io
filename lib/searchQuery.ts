// Query helpers shared by the search modal (which builds a link to a post)
// and the post page (which reads that link and highlights the matches).

/** Splits a query into lowercase terms. "quoted phrases" stay together. */
export function parseQuery(input: string): string[] {
  const terms: string[] = []
  const re = /"([^"]+)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    const t = (m[1] ?? m[2])
      .replace(/^"+|"+$/g, '')
      .trim()
      .toLowerCase()
    if (t) terms.push(t)
  }
  return Array.from(new Set(terms))
}

/** Inverse of parseQuery: terms with spaces are quoted again. */
export function serializeTerms(terms: string[]): string {
  return terms.map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' ')
}

/**
 * Lowercases text and reduces it to printable ASCII with single spaces, keeping
 * a map from each normalised character back to its index in the original.
 * Used for the "context" string in result links so that the search index text
 * and the rendered page text can be compared even though their punctuation,
 * whitespace and typographic characters differ.
 */
export function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c > ' ' && c <= '~') {
      norm += c.toLowerCase()
      map.push(i)
    } else if (norm.length > 0 && norm[norm.length - 1] !== ' ') {
      norm += ' '
      map.push(i)
    }
  }
  return { norm, map }
}

export function contextKey(text: string): string {
  return normalizeWithMap(text).norm.trim()
}
