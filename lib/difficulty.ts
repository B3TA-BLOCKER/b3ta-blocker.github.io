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

/** Glow colour for a post's icon. */
export function glowColorForTags(tags: string[] | undefined): string {
  const d = difficultyFromTags(tags)
  return d ? DIFF_COLOR[d] : NEUTRAL_COLOR
}

/**
 * Hover/focus glow for a post icon: the icon's outline lights up in the
 * difficulty colour (read from the --glow CSS variable). Nothing moves or
 * scales. drop-shadow follows the artwork's own shape, so a round icon gets a
 * round glow. Put `group` on the surrounding link and set --glow on this element.
 */
export const ICON_GLOW_CLASS =
  'transition-[filter] duration-200 [filter:drop-shadow(0_0_0_transparent)_drop-shadow(0_0_0_transparent)] hover:[filter:drop-shadow(0_0_3px_var(--glow))_drop-shadow(0_0_12px_var(--glow))] group-focus-visible:[filter:drop-shadow(0_0_3px_var(--glow))_drop-shadow(0_0_12px_var(--glow))]'

/**
 * Hover/focus glow for a post title: the text takes the difficulty colour (read
 * from the --glow CSS variable) with a soft halo of the same colour. Set --glow
 * on the same element.
 *
 * Dark mode: the exact difficulty colour with a faint, tight halo, so the
 * letters stay sharp and the glow doesn't bleed onto the tags underneath.
 * Light mode: the palette colours are tuned for dark backgrounds (silver or
 * light green on white would be unreadable, and a pale halo alone is invisible),
 * so the text turns a deepened shade of the difficulty colour (60% colour, 40%
 * black — 4.3:1 to 8:1 contrast on white for every difficulty) and the halo is
 * slightly wider and stronger.
 */
// NOTE: keep these class names as complete literal strings. Tailwind finds
// classes by scanning the source text, so building them from pieces
// (`hover:${x}`) would silently generate no CSS.
export const TITLE_GLOW_CLASS =
  'transition-[color,text-shadow] duration-200 ' +
  'hover:text-[color:color-mix(in_srgb,var(--glow)_60%,black)] focus-visible:text-[color:color-mix(in_srgb,var(--glow)_60%,black)] ' +
  'hover:[text-shadow:0_0_10px_color-mix(in_srgb,var(--glow)_55%,transparent)] focus-visible:[text-shadow:0_0_10px_color-mix(in_srgb,var(--glow)_55%,transparent)] ' +
  'dark:hover:text-[color:var(--glow)] dark:focus-visible:text-[color:var(--glow)] ' +
  'dark:hover:[text-shadow:0_0_8px_color-mix(in_srgb,var(--glow)_40%,transparent)] dark:focus-visible:[text-shadow:0_0_8px_color-mix(in_srgb,var(--glow)_40%,transparent)]'
