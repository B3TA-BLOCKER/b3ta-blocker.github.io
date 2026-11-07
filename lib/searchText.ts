// Turns raw MDX into the two plain-text fields that go into public/search.json:
//   text — the prose, with markdown/JSX syntax removed
//   code — the contents of fenced code blocks (commands, payloads, configs…)
// They are kept apart so a hit inside a code block can be labelled as code.

function stripProse(raw: string): string {
  return raw
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/<\/?[^>]+>/g, ' ') // stray html/jsx tags
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/^\s*>+\s?/gm, '') // blockquote markers
    .replace(/\*{1,2}|~~/g, '') // bold / italic / strikethrough markers
    .replace(/(^|\s)_+|_+(?=\s|$)/g, '$1') // underscore emphasis (keeps snake_case)
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractSearchText(raw: string): { text: string; code: string } {
  const blocks: string[] = []
  const prose = raw.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, body: string) => {
    blocks.push(body)
    return ' '
  })
  return {
    text: stripProse(prose),
    code: blocks
      .map((b) => b.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' \n '),
  }
}
