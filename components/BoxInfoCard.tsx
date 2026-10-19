'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react'

export type Difficulty = 'veryeasy' | 'easy' | 'medium' | 'hard' | 'insane'

export interface BadgeInfo {
  name: string
  htbProfileUrl: string
  avatarUrl?: string
  /** Override for the official HTB badge image. Defaults to
   *  https://www.hackthebox.com/badge/image/<user id> (id is read from htbProfileUrl). */
  badgeImageUrl?: string
  /** Title shown next to the name, e.g. "Omniscient", "Guru". */
  title?: string
  /** Global rank number, e.g. "2" or "212". */
  rank?: string
  /** Respects count (blue diamond icon), e.g. 2389. */
  respects?: number
  /** Points / owns count (orange star icon), e.g. 524. */
  points?: number
}

export interface BloodInfo extends BadgeInfo {
  time: string
}

export interface RadarValues {
  enumeration: number
  realLife: number
  cve: number
  customExploitation: number
  ctfLike: number
}

export interface BoxInfoCardProps {
  name: string
  iconUrl: string
  /** Optional wide banner image shown as the header background. This is shared across every
   *  writeup, so save one file once at public/static/images/htb/header-bg.jpg (1200x260px,
   *  roughly 4.6:1) and pass headerBgUrl="/static/images/htb/header-bg.jpg" on every box.
   *  Dark/moody art works best since it sits behind a translucent dark overlay. */
  headerBgUrl?: string
  /** Optional when htbMachine is set: pulled from HackTheBox. Anything you pass overrides it. */
  difficulty?: Difficulty | string
  os?: string
  releaseDate?: string
  retireDate?: string
  /** Exact per-bar percentages from the box's "Rated Difficulty" histogram on HackTheBox — read them off the box page, don't estimate. Typically 7-10 bars. */
  difficultyRatingBars?: number[]
  /** Exact values (0-100) from the box's real HTB radar graph for each axis. */
  radar?: RadarValues
  /** Optional second (white) polygon, e.g. the community average. */
  radarAverage?: RadarValues
  /** HTB machine name, e.g. "Cap". When set, the difficulty bars and radar are loaded
   *  from /htb-data/<name>.json (generated at build time) and override the static props above (which then act as a
   *  fallback if the request fails). */
  htbMachine?: string
  /** Link target for the box name and icon. Defaults to the machine's page on HTB
   *  (built from htbMachine, or name if htbMachine is not set). */
  machineUrl?: string
  officialUserTime?: string
  officialRootTime?: string
  creator?: Partial<BadgeInfo>
  /** Several authors, e.g. [{ name: 'A', htbProfileUrl: '...' }, { name: 'B', htbProfileUrl: '...' }].
   *  Overrides the authors pulled from HTB. */
  creators?: Partial<BadgeInfo>[]
  yourUserTime?: string
  yourRootTime?: string
  userBlood?: BloodInfo
  rootBlood?: BloodInfo
}

const NEUTRAL_COLOR = '#6fb8e8'

/** Keep only characters that can appear in an HTB machine name (drops stray backticks, quotes, spaces). */
function cleanMachine(v: string) {
  return v.replace(/[^A-Za-z0-9_-]/g, '')
}

/** Difficulty colours; used for the pill, the icon border and the hover glow. Edit freely. */
const DIFF_COLOR: Record<Difficulty, string> = {
  veryeasy: '#a56cff', // purple
  easy: '#5fd778', // green
  medium: '#e0a526', // orange / yellow
  hard: '#e05c5c', // red
  insane: '#cfc6e6', // silver
}

const DIFF_LABEL: Record<Difficulty, string> = {
  veryeasy: 'Very Easy',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  insane: 'Insane',
}

/** Operating-system logo + word, coloured with each OS's brand colours. */
function WindowsLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3h8.2v8.2H3z" fill="#F25022" />
      <path d="M12.8 3H21v8.2h-8.2z" fill="#7FBA00" />
      <path d="M3 12.8h8.2V21H3z" fill="#00A4EF" />
      <path d="M12.8 12.8H21V21h-8.2z" fill="#FFB900" />
    </svg>
  )
}

function LinuxLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="14" rx="6.6" ry="8" fill="#3a3f47" stroke="#6b7580" strokeWidth="0.8" />
      <ellipse cx="12" cy="7.5" rx="4.4" ry="5" fill="#3a3f47" stroke="#6b7580" strokeWidth="0.8" />
      <ellipse cx="12" cy="15.2" rx="4" ry="5.6" fill="#f2f2f2" />
      <circle cx="10.4" cy="6.4" r="1.1" fill="#fff" />
      <circle cx="13.6" cy="6.4" r="1.1" fill="#fff" />
      <circle cx="10.5" cy="6.5" r="0.5" fill="#111" />
      <circle cx="13.5" cy="6.5" r="0.5" fill="#111" />
      <path d="M10.3 8.2h3.4L12 10.4z" fill="#FCC624" />
      <ellipse cx="8.4" cy="22" rx="2.6" ry="1.2" fill="#FCC624" />
      <ellipse cx="15.6" cy="22" rx="2.6" ry="1.2" fill="#FCC624" />
    </svg>
  )
}

function OsLabel({ os }: { os: string }) {
  const key = os.toLowerCase()
  let color = '#dce3ee'
  let logo: React.ReactNode = null
  if (key.includes('windows')) {
    color = '#00A4EF'
    logo = <WindowsLogo />
  } else if (key.includes('linux')) {
    color = '#FCC624'
    logo = <LinuxLogo />
  } else if (key.includes('freebsd')) {
    color = '#E04B47'
  } else if (key.includes('openbsd')) {
    color = '#F2CA30'
  } else if (key.includes('android')) {
    color = '#3DDC84'
  }
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontSize: 14,
        fontWeight: 700,
        color,
      }}
    >
      {logo}
      {os}
    </div>
  )
}

/** Shared style for every section heading (Release Date, Radar Graph, First Blood, ...). */
const HEADING_COLOR = '#a9b8cc'

const SECTION_HEADING_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: HEADING_COLOR,
  letterSpacing: 1.2,
  textAlign: 'left',
  marginBottom: 8,
}

const META_LABEL_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: HEADING_COLOR,
  letterSpacing: 1,
  marginBottom: 4,
}

/** HTB colours the rating histogram by POSITION (left = easy, right = hard), not by value. */
const BAR_GREEN = '#9fef00'
const BAR_YELLOW = '#ffaf00'
const BAR_RED = '#ff3e3e'
const BAR_EMPTY = '#3a4658'
const GREEN = '#9fef00'

function barColor(index: number, total: number) {
  const f = index / Math.max(1, total)
  if (f < 0.4) return BAR_GREEN
  if (f < 0.7) return BAR_YELLOW
  return BAR_RED
}

interface LiveMachineData {
  difficultyRatingBars?: number[]
  radar?: RadarValues
  radarAverage?: RadarValues
  difficulty?: string
  os?: string
  releaseDate?: string
  retireDate?: string
  creator?: Partial<BadgeInfo>
  creators?: Partial<BadgeInfo>[]
  userBlood?: Partial<BloodInfo>
  rootBlood?: Partial<BloodInfo>
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

/** Prefix site-relative asset paths (e.g. /htb-data/avatars/1.png) with the base path. */
function withBase(blood?: Partial<BloodInfo>): Partial<BloodInfo> | undefined {
  if (!blood) return blood
  const url = blood.avatarUrl
  if (url && url.startsWith('/') && !url.startsWith('//')) {
    return { ...blood, avatarUrl: BASE_PATH + url }
  }
  return blood
}

function definedOnly<T extends object>(o?: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(o ?? {}).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<T>
}

/** Live data fills in what you did not pass; anything you pass explicitly wins. */
function mergeBlood(live?: Partial<BloodInfo>, own?: BloodInfo): BloodInfo | undefined {
  if (!live && !own) return undefined
  const defined = Object.fromEntries(
    Object.entries(own ?? {}).filter(([, v]) => v !== undefined && v !== '')
  )
  const merged = { time: '--:--:--', ...live, ...defined } as BloodInfo
  return merged.name && merged.htbProfileUrl ? merged : own
}

function useHtbMachine(name?: string) {
  const [data, setData] = useState<LiveMachineData | null>(null)
  useEffect(() => {
    if (!name) return
    let cancelled = false
    fetch(BASE_PATH + '/htb-data/' + encodeURIComponent(name) + '.json')
      .then((r) => {
        if (!r.ok) {
          console.warn('[BoxInfoCard] no HTB data for "' + name + '" (HTTP ' + r.status + ')')
          return null
        }
        return r.json()
      })
      .then((j) => {
        if (!cancelled && j) {
          const d = j as LiveMachineData
          setData({ ...d, userBlood: withBase(d.userBlood), rootBlood: withBase(d.rootBlood) })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [name])
  return data
}

const RADAR_LABELS = ['Enumeration', 'Real-Life', 'CVE', 'Custom Exploitation', 'CTF-Like']

function axisPoint(i: number, n: number, cx: number, cy: number, r: number) {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function radarPoints(r: RadarValues, cx: number, cy: number, maxR: number) {
  const vals = [r.enumeration, r.realLife, r.cve, r.customExploitation, r.ctfLike]
  return vals.map((v, i) => axisPoint(i, 5, cx, cy, (Math.max(0, Math.min(100, v)) / 100) * maxR))
}

function radarPolygon(r: RadarValues, cx: number, cy: number, maxR: number) {
  return radarPoints(r, cx, cy, maxR)
    .map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1))
    .join(' ')
}

function CubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9fef00"
      strokeWidth={2.2}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M12 2 21 7v10l-9 5-9-5V7z" />
      <path d="M3 7l9 5 9-5M12 12v10" />
    </svg>
  )
}

function RespectIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4aa8e8"
      strokeWidth={2.4}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M12 3 21 12 12 21 3 12z" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

// Width of the official HTB badge image (height follows the image's own proportions).
const BADGE_WIDTH = 260

function Badge({ badge }: { badge: BadgeInfo }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [badgeFailed, setBadgeFailed] = useState(false)
  const showImg = !!badge.avatarUrl && !imgFailed

  // The official HTB badge image is rendered by HTB itself, so name, avatar, rank,
  // respects and points always stay up to date with no work on our side.
  const userId = badge.htbProfileUrl.match(/users\/(\d+)/)?.[1]
  const badgeSrc =
    badge.badgeImageUrl ?? (userId ? 'https://www.hackthebox.com/badge/image/' + userId : undefined)

  if (badgeSrc && !badgeFailed) {
    return (
      <a
        href={badge.htbProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', lineHeight: 0, flexShrink: 0 }}
      >
        <img
          src={badgeSrc}
          alt={badge.name + ' on Hack The Box'}
          referrerPolicy="no-referrer"
          onError={() => setBadgeFailed(true)}
          style={{
            display: 'block',
            width: BADGE_WIDTH,
            maxWidth: '100%',
            height: 'auto',
            // the blog's typography styles add large top/bottom margins to <img>; cancel them
            margin: 0,
            borderRadius: 6,
          }}
        />
      </a>
    )
  }

  // Fallback: compact custom card, used only if the official badge fails to load.
  return (
    <a
      href={badge.htbProfileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: '#141f30',
        border: '1px solid #233247',
        borderRadius: 7,
        padding: '5px 30px 5px 7px',
        textDecoration: 'none',
        minWidth: 180,
      }}
    >
      {showImg ? (
        <img
          src={badge.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{
            width: 30,
            height: 30,
            margin: 0,
            borderRadius: 4,
            flexShrink: 0,
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            background: '#1c2838',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7c93',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {badge.name.charAt(0)}
        </div>
      )}
      <div style={{ lineHeight: 1.25, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: '#f1f5fb', fontSize: 12, fontWeight: 700 }}>{badge.name}</span>
          {badge.title && (
            <span style={{ color: '#aeb9c9', fontSize: 11, fontWeight: 500 }}>{badge.title}</span>
          )}
        </div>
        {(badge.rank || badge.respects !== undefined || badge.points !== undefined) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            {badge.rank && <span style={{ color: '#dce3ee' }}>Rank: {badge.rank}</span>}
            {badge.respects !== undefined && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#4aa8e8' }}
              >
                <RespectIcon />
                {badge.respects}
              </span>
            )}
            {badge.points !== undefined && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f0a020' }}
              >
                <span style={{ fontSize: 11 }}>★</span>
                {badge.points}
              </span>
            )}
          </div>
        )}
        <div style={{ color: '#9fef00', fontSize: 10 }}>hackthebox.com</div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 7,
          bottom: 6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#0a111b',
          border: '1px solid #233247',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CubeIcon size={12} />
      </div>
    </a>
  )
}

const BLOOD_RED = '#ff6b81'
const BLOOD_BG = 'rgba(224, 92, 122, 0.22)'

/** User-blood icon: flask with a drop inside. */
function UserBloodIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={BLOOD_RED}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h6" />
      <path d="M10 3v5.5L4.8 17.4A2.2 2.2 0 0 0 6.7 20.7h10.6a2.2 2.2 0 0 0 1.9-3.3L14 8.5V3" />
      <path d="M12 12.2c1.3 1.6 2 2.6 2 3.6a2 2 0 0 1-4 0c0-1 .7-2 2-3.6z" />
    </svg>
  )
}

/** Root-blood icon: tilted drop. */
function RootBloodIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={BLOOD_RED}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3c3.2 4.2 5.5 6.9 5.5 10a5.5 5.5 0 0 1-11 0C6.5 9.9 8.8 7.2 12 3z" />
      <path d="M9.5 14a2.6 2.6 0 0 0 2.5 2.4" />
    </svg>
  )
}

function BloodTag({ kind }: { kind: 'user' | 'root' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        flexShrink: 0,
        background: BLOOD_BG,
        color: BLOOD_RED,
        borderRadius: 999,
        padding: '5px 13px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}
      title={kind === 'user' ? 'User blood' : 'Root blood'}
    >
      {kind === 'user' ? <UserBloodIcon /> : <RootBloodIcon />}
      {kind}
    </span>
  )
}

/** One First Blood row: pill on the left, LCD clock in the middle, HTB profile card on the right. */
function BloodRow({ kind, blood }: { kind: 'user' | 'root'; blood: BloodInfo }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <BloodTag kind={kind} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 110 }}>
        <LcdTimer value={blood.time} small />
      </div>
      <Badge badge={blood} />
    </div>
  )
}

function LcdTimer({ value, small }: { value: string; small?: boolean }) {
  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontWeight: 700,
        fontSize: small ? 15 : 20,
        letterSpacing: 1.5,
        color: '#4ef066',
        background: '#081109',
        border: '1px solid #163a1c',
        borderRadius: 5,
        padding: small ? '4px 9px' : '5px 12px',
        textShadow: '0 0 6px rgba(78,240,102,0.5)',
        display: 'inline-block',
      }}
    >
      {value}
    </div>
  )
}

export default function BoxInfoCard(props: BoxInfoCardProps) {
  const {
    name,
    iconUrl,
    headerBgUrl,
    difficulty: propDifficulty,
    os: propOs,
    releaseDate: propRelease,
    retireDate: propRetire,
    htbMachine,
    machineUrl: propMachineUrl,
    difficultyRatingBars: propBars,
    radar: propRadar,
    radarAverage: propAvg,
    creator: propCreator,
    creators: propCreators,
    yourUserTime,
    yourRootTime,
    userBlood: propUserBlood,
    rootBlood: propRootBlood,
  } = props

  const machineKey = htbMachine ? cleanMachine(htbMachine) : undefined
  const live = useHtbMachine(machineKey)
  // hover/focus state is tracked separately, so the icon and the name glow independently
  const [hoverIcon, setHoverIcon] = useState(false)
  const [hoverName, setHoverName] = useState(false)
  const iconHoverProps = {
    onMouseEnter: () => setHoverIcon(true),
    onMouseLeave: () => setHoverIcon(false),
    onFocus: () => setHoverIcon(true),
    onBlur: () => setHoverIcon(false),
  }
  const nameHoverProps = {
    onMouseEnter: () => setHoverName(true),
    onMouseLeave: () => setHoverName(false),
    onFocus: () => setHoverName(true),
    onBlur: () => setHoverName(false),
  }
  // Difficulty comes from HTB (or the difficulty prop). If it is unknown we show NO pill and a
  // neutral colour, instead of guessing "easy".
  const diffRaw = String(propDifficulty ?? live?.difficulty ?? '')
    .toLowerCase()
    .replace(/[\s_-]/g, '')
  const difficulty: Difficulty | null = diffRaw in DIFF_COLOR ? (diffRaw as Difficulty) : null
  const diffColor = difficulty ? DIFF_COLOR[difficulty] : NEUTRAL_COLOR
  const machineUrl =
    propMachineUrl ??
    'https://www.hackthebox.com/machines/' + cleanMachine(machineKey ?? name).toLowerCase()
  const os = propOs ?? live?.os ?? ''
  const releaseDate = propRelease ?? live?.releaseDate ?? ''
  const retireDate = propRetire ?? live?.retireDate ?? ''
  const creators: Partial<BadgeInfo>[] = (
    propCreators ??
    (propCreator
      ? [{ ...live?.creator, ...definedOnly(propCreator) }]
      : (live?.creators ?? (live?.creator ? [live.creator] : [])))
  ).filter((c) => c.name)
  const bars = live?.difficultyRatingBars ?? propBars ?? []
  const radar: RadarValues = live?.radar ??
    propRadar ?? { enumeration: 0, realLife: 0, cve: 0, customExploitation: 0, ctfLike: 0 }
  const radarAvg = live?.radarAverage ?? propAvg
  const maxBar = Math.max(1, ...bars)
  const userBlood = mergeBlood(live?.userBlood, propUserBlood)
  const rootBlood = mergeBlood(live?.rootBlood, propRootBlood)

  const radarSize = 300
  const cx = radarSize / 2
  const cy = radarSize / 2
  const maxR = radarSize / 2 - 58

  return (
    <div
      style={{
        background: '#0c1420',
        border: '1px solid #1c2838',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: "'Courier New', monospace",
        width: '100%',
        maxWidth: 560,
        margin: '0 auto', // centre the card in the page column
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* header band: icon, name, creator, difficulty pill + bars (compact) */}
      <div
        style={{
          position: 'relative',
          backgroundImage: headerBgUrl
            ? 'linear-gradient(135deg, rgba(10,16,26,0.86), rgba(10,16,26,0.93)), url(' +
              headerBgUrl +
              ')'
            : 'linear-gradient(135deg, #142033 0%, #0f1822 60%, #0c1420 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '6px 18px',
          borderBottom: '1px solid #1c2838',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a
            href={machineUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={'Play ' + name + ' on Hack The Box'}
            style={{ display: 'block', lineHeight: 0, flexShrink: 0, textDecoration: 'none' }}
            {...iconHoverProps}
          >
            <img
              src={iconUrl}
              alt={name + ' icon'}
              style={{
                width: 50,
                height: 50,
                margin: 0,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                background: 'transparent',
                boxShadow: hoverIcon
                  ? '0 0 16px 2px ' + diffColor + ', 0 0 4px ' + diffColor
                  : '0 0 0 0 transparent',
                transition: 'box-shadow 0.2s ease',
              }}
            />
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href={machineUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={'Play ' + name + ' on Hack The Box'}
              style={{
                display: 'block',
                width: 'fit-content',
                color: hoverName ? diffColor : '#f1f5fb',
                fontSize: 19,
                fontWeight: 700,
                lineHeight: 1.2,
                textDecoration: 'none',
                textShadow: hoverName
                  ? '0 0 8px ' + diffColor + ', 0 0 18px ' + diffColor
                  : '0 0 0 transparent',
                transition: 'color 0.2s ease, text-shadow 0.2s ease',
              }}
              {...nameHoverProps}
            >
              {name}
            </a>
            {creators.length > 0 && (
              <div style={{ fontSize: 11, color: '#8a9bb3' }}>
                by{' '}
                {creators.map((c, idx) => (
                  <React.Fragment key={(c.name ?? '') + idx}>
                    {idx > 0 && (idx === creators.length - 1 ? ' & ' : ', ')}
                    <a
                      href={c.htbProfileUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5a9bd8', textDecoration: 'none' }}
                    >
                      {c.name}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 3,
                height: 26,
              }}
            >
              {bars.map((v, i) =>
                v <= 0 ? (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: BAR_EMPTY,
                      margin: '0 1px',
                    }}
                  />
                ) : (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: Math.max(12, (v / maxBar) * 100) + '%',
                      background: barColor(i, bars.length),
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                )
              )}
            </div>
            {difficulty && (
              <span
                style={{
                  display: 'inline-block',
                  border: '1px solid ' + diffColor,
                  color: diffColor,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 999,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {DIFF_LABEL[difficulty]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* meta strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            paddingBottom: 14,
            marginBottom: 16,
            borderBottom: '1px solid #1c2838',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={META_LABEL_STYLE}>RELEASE DATE</div>
            <div
              style={{ fontSize: 14, color: releaseDate ? diffColor : '#6b7c93', fontWeight: 600 }}
            >
              {releaseDate || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={META_LABEL_STYLE}>RETIRE DATE</div>
            <div
              style={{ fontSize: 14, color: retireDate ? '#dce3ee' : '#6b7c93', fontWeight: 600 }}
            >
              {retireDate || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={META_LABEL_STYLE}>OS</div>
            {os ? (
              <OsLabel os={os} />
            ) : (
              <div style={{ fontSize: 14, color: '#6b7c93', fontWeight: 600 }}>—</div>
            )}
          </div>
        </div>

        {/* radar graph: heading left-aligned, chart itself stays centered */}
        <div style={{ marginBottom: 2 }}>
          <div style={SECTION_HEADING_STYLE}>RADAR GRAPH</div>
          <svg
            viewBox={'0 8 ' + radarSize + ' ' + (radarSize - 34)}
            style={{
              width: '100%',
              maxWidth: 300,
              display: 'block',
              margin: '0 auto',
              overflow: 'visible',
            }}
          >
            {[0.33, 0.66, 1].map((f, idx) => (
              <polygon
                key={idx}
                points={Array.from({ length: 5 })
                  .map((_, i) => {
                    const p = axisPoint(i, 5, cx, cy, maxR * f)
                    return p.x.toFixed(1) + ',' + p.y.toFixed(1)
                  })
                  .join(' ')}
                fill="none"
                stroke="#1c2838"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => {
              const p = axisPoint(i, 5, cx, cy, maxR)
              return (
                <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1c2838" strokeWidth={1} />
              )
            })}
            {radarAvg && (
              <>
                <polygon
                  points={radarPolygon(radarAvg, cx, cy, maxR)}
                  fill="#ffffff"
                  fillOpacity={0.12}
                  stroke="#ffffff"
                  strokeWidth={1.2}
                />
                {radarPoints(radarAvg, cx, cy, maxR).map((p, i) => (
                  <circle key={'a' + i} cx={p.x} cy={p.y} r={3} fill="#ffffff" />
                ))}
              </>
            )}
            <polygon
              points={radarPolygon(radar, cx, cy, maxR)}
              fill={GREEN}
              fillOpacity={0.25}
              stroke={GREEN}
              strokeWidth={1.6}
            />
            {radarPoints(radar, cx, cy, maxR).map((p, i) => (
              <circle key={'m' + i} cx={p.x} cy={p.y} r={3.5} fill={GREEN} />
            ))}
            {RADAR_LABELS.map((label, i) => {
              const p = axisPoint(i, 5, cx, cy, maxR + 30)
              const words = label.split(' ')
              return (
                <foreignObject
                  key={label}
                  x={p.x - 65}
                  y={p.y - 16}
                  width={130}
                  height={32}
                  style={{ overflow: 'visible' }}
                >
                  <div
                    style={{
                      width: 130,
                      textAlign: 'center',
                      color: '#8cc8f0',
                      fontSize: 14,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {words.map((w, wi) => (
                      <div key={wi}>{w}</div>
                    ))}
                  </div>
                </foreignObject>
              )
            })}
          </svg>
        </div>

        {/* first blood */}
        {(userBlood || rootBlood) && (
          <div
            style={{
              marginBottom: 18,
              paddingTop: 12,
              borderTop: '1px solid #1c2838',
            }}
          >
            <div style={SECTION_HEADING_STYLE}>FIRST BLOOD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {userBlood && <BloodRow kind="user" blood={userBlood} />}
              {rootBlood && <BloodRow kind="root" blood={rootBlood} />}
            </div>
          </div>
        )}

        {/* my time, last */}
        {(yourUserTime || yourRootTime) && (
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid #1c2838',
            }}
          >
            <div style={SECTION_HEADING_STYLE}>MY TIME</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {yourUserTime && (
                <div
                  style={{
                    borderLeft: '3px solid #e05c7a',
                    padding: '3px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{ color: '#e0a0b0', fontSize: 14, letterSpacing: 1, fontWeight: 700 }}
                  >
                    USER
                  </span>
                  <LcdTimer value={yourUserTime} small />
                </div>
              )}
              {yourRootTime && (
                <div
                  style={{
                    borderLeft: '3px solid #e05c7a',
                    padding: '3px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{ color: '#e0a0b0', fontSize: 14, letterSpacing: 1, fontWeight: 700 }}
                  >
                    ROOT
                  </span>
                  <LcdTimer value={yourRootTime} small />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
