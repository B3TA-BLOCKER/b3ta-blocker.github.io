// Single source of truth for HackTheBox difficulty colours. Used by the machine
// info card (BoxInfoCard) and by the post icons and titles in the home / blog lists,
// so the hover glow always matches the difficulty colour on the machine card.

export type Difficulty = 'veryeasy' | 'easy' | 'medium' | 'hard' | 'insane'

/** Shown when a post has no difficulty tag (same fallback BoxInfoCard uses). */
export const NEUTRAL_COLOR = '#6fb8e8'

/** Difficulty colours. Edit freely. */
export const DIFF_COLOR: Record<Difficulty, string> = {
  veryeasy: '#a56cff', // purple
  easy: '#5fd778', // green
  medium: '#e0a526', // orange / yellow
  hard: '#e05c5c', // red
  insane: '#cfc6e6', // silver
}

/** "Very Easy", "very-easy", "very_easy" … -> 'veryeasy', or null if it isn't a difficulty. */
export function toDifficulty(value: string | undefined | null): Difficulty | null {
  const key = String(value ?? '')
    .toLowerCase()
    .replace(/[\s_-]/g, '')
  return key in DIFF_COLOR ? (key as Difficulty) : null
}

/** Difficulty of a post, read from its tags (e.g. 'Easy', 'Very Easy'). */
export function difficultyFromTags(tags: string[] | undefined): Difficulty | null {
  for (const tag of tags ?? []) {
    const d = toDifficulty(tag)
    if (d) return d
  }
  return null
}

/** A HackTheBox machine: its icon ring is already drawn in the difficulty colour. */
export function isHtbMachine(tags: string[] | undefined): boolean {
  const t = (tags ?? []).map((x) => x.toLowerCase())
  return t.includes('machine') && t.includes('hackthebox')
}

/** Difficulty-based glow colour (also the first-paint fallback for HTB machine icons). */
export function glowColorForTags(tags: string[] | undefined): string {
  const d = difficultyFromTags(tags)
  return d ? DIFF_COLOR[d] : NEUTRAL_COLOR
}

// NOTE: keep every class below as a complete literal string. Tailwind finds
// classes by scanning the source text, so building them from pieces
// (`hover:${x}`) would silently generate no CSS.
//
// The classes read three CSS variables that a <GlowScope> sets from the icon's
// edge colour: --glow (for dark pages), --glow-light (for white pages) and
// --glow-text (title colour on dark pages).

/**
 * Hover/focus glow for a post icon: the icon's outline lights up in the icon's
 * own edge colour. Nothing moves or scales. drop-shadow follows the artwork's
 * shape, so a round icon gets a round glow. Put `group` on the surrounding link
 * so keyboard focus lights it up too. White pages get a slightly wider glow in a
 * deeper colour so it stays visible.
 */
export const ICON_GLOW_CLASS =
  'transition-[filter] duration-200 ' +
  '[filter:drop-shadow(0_0_0_transparent)_drop-shadow(0_0_0_transparent)] ' +
  'hover:[filter:drop-shadow(0_0_4px_var(--glow-light))_drop-shadow(0_0_14px_var(--glow-light))] ' +
  'group-focus-visible:[filter:drop-shadow(0_0_4px_var(--glow-light))_drop-shadow(0_0_14px_var(--glow-light))] ' +
  'dark:hover:[filter:drop-shadow(0_0_3px_var(--glow))_drop-shadow(0_0_12px_var(--glow))] ' +
  'dark:group-focus-visible:[filter:drop-shadow(0_0_3px_var(--glow))_drop-shadow(0_0_12px_var(--glow))]'

/**
 * Hover/focus glow for a post title, in the same colour as the post's icon.
 *
 * Dark mode: the title turns the glow colour with a faint, tight halo, so the
 * letters stay sharp and the glow doesn't bleed onto the tags underneath.
 * Light mode: pale colours are unreadable as text on white, so the title turns a
 * deepened shade of the glow colour (70% colour, 30% black — at least 4.3:1
 * contrast for every colour the icons produce) with a stronger halo.
 */
export const TITLE_GLOW_CLASS =
  'transition-[color,text-shadow] duration-200 ' +
  'hover:text-[color:color-mix(in_srgb,var(--glow-light)_70%,black)] focus-visible:text-[color:color-mix(in_srgb,var(--glow-light)_70%,black)] ' +
  'hover:[text-shadow:0_0_10px_color-mix(in_srgb,var(--glow-light)_55%,transparent)] focus-visible:[text-shadow:0_0_10px_color-mix(in_srgb,var(--glow-light)_55%,transparent)] ' +
  'dark:hover:text-[color:var(--glow-text)] dark:focus-visible:text-[color:var(--glow-text)] ' +
  'dark:hover:[text-shadow:0_0_8px_color-mix(in_srgb,var(--glow)_40%,transparent)] dark:focus-visible:[text-shadow:0_0_8px_color-mix(in_srgb,var(--glow)_40%,transparent)]'
