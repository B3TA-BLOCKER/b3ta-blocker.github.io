// Coordinates the one-time homepage intro (handwritten "Latest post" line →
// nav glow-in → terminal typing → blog cards) across Header and Main, which
// are separate components that both mount on the homepage.
//
// - sessionStorage remembers it's been seen so it only plays once per tab
//   session, not on every navigation back to "/".
// - A window event lets Header (which draws first) tell Main (which types
//   second) when to start, without lifting state through the server tree.

const INTRO_SESSION_KEY = 'ba-intro-seen-v1'
export const INTRO_PHASE_TWO_EVENT = 'ba:intro-phase-two'

export function hasSeenIntro(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === '1'
  } catch {
    // Private browsing / storage disabled — just don't replay the intro
    // every render; treat as "seen" so the site still works normally.
    return true
  }
}

export function markIntroSeen(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, '1')
  } catch {
    /* no-op — see hasSeenIntro */
  }
}

export function startIntroPhaseTwo(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(INTRO_PHASE_TWO_EVENT))
}
