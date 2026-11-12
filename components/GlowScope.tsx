'use client'

import { createContext, useContext, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { glowColorForTags, isHtbMachine } from '@/lib/difficulty'
import { ACCENT_GLOW, type GlowColors } from '@/lib/iconColor'

// Wraps one post row. It owns the row's glow colour as CSS variables
// (--glow, --glow-light, --glow-text), so the icon and the title — which are
// separate elements — always glow the same colour. <PostIcon> reports the colour
// it reads from the icon's edge via useSetGlow(); every descendant that uses
// those variables (ICON_GLOW_CLASS, TITLE_GLOW_CLASS) updates automatically.

const SetGlow = createContext<(c: GlowColors) => void>(() => {})

export const useSetGlow = () => useContext(SetGlow)

/** Colour used until the icon has been read: HTB machines show their difficulty colour. */
function initialGlow(tags?: string[]): GlowColors {
  if (!isHtbMachine(tags)) return ACCENT_GLOW
  const c = glowColorForTags(tags)
  return { dark: c, light: c, text: c }
}

export default function GlowScope({ tags, children }: { tags?: string[]; children: ReactNode }) {
  const [glow, setGlow] = useState(() => initialGlow(tags))
  return (
    <SetGlow.Provider value={setGlow}>
      {/* display: contents keeps the surrounding layout exactly as it was */}
      <div
        className="contents"
        style={
          {
            '--glow': glow.dark,
            '--glow-light': glow.light,
            '--glow-text': glow.text,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </SetGlow.Provider>
  )
}
