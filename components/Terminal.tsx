'use client'

import { useEffect, useRef, useState } from 'react'

export default function Terminal() {
  const [lines, setLines] = useState<{cls: string, html: string}[]>([
    {cls:'gray', html:'# Welcome. Type <span style="color:#48bb78">help</span> to get started.'},
    {cls:'', html:'&nbsp;'},
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [minimized, setMinimized] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [closed, setClosed] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB',{day:'2-digit',month:'short' as const,year:'numeric'})
  const timeStr = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})

  const visibleFiles: Record<string, {size: string}> = {
    'setup.txt':     {size:'1.2K'},
    'goals.txt':     {size:' 896'},
    'books.txt':     {size:'1.8K'},
    'favourites.txt':{size:' 640'},
  }

  const hiddenFiles: Record<string, {size: string, isDir?: boolean}> = {
    '.bash_history': {size:' 420'},
    '.bashrc':       {size:'3.5K'},
    '.profile':      {size:' 807'},
    '.ssh':          {size:'4.0K', isDir: true},
  }

  type Line = {t: string, k?: string, v: string}

  const fileContents: Record<string, Line[]> = {
    'setup.txt': [
      {t:'green', v:'# Daily Setup'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ Machine ]'},
      {t:'kv', k:'model',   v:'Lenovo ThinkBook E14 Gen 6 — 14" Black'},
      {t:'kv', k:'cpu',     v:'Intel Core Ultra 7 155H · 16 cores · 22 threads'},
      {t:'kv', k:'ram',     v:'32GB DDR5 5600MT/s'},
      {t:'kv', k:'gpu',     v:'Intel Arc Graphics'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ Operating Systems ]'},
      {t:'kv', k:'main',    v:'Windows 11'},
      {t:'kv', k:'hacking', v:'Kali Linux — daily driver for HTB machines'},
      {t:'kv', k:'pwn',     v:'Ubuntu — dedicated to exploit dev & pwn challenges'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ Workflow ]'},
      {t:'plain', v:'  Windows 11 host → VirtualBox → Kali for HTB'},
      {t:'plain', v:'  Ubuntu VM spun up only when doing binary exploitation'},
      {t:'plain', v:'  Everything runs local — no cloud VMs for personal labs'},
    ],
    'goals.txt': [
      {t:'green', v:'# Goals & Roadmap'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ Short Term ]'},
      {t:'plain', v:'  → Land first full-time security role'},
      {t:'plain', v:'  → Get deeper into exploit development'},
      {t:'plain', v:'  → Complete more HTB Pro Labs'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ Long Term ]'},
      {t:'plain', v:'  → Become a malware researcher / security researcher'},
      {t:'plain', v:'  → Contribute to vulnerability research'},
      {t:'empty', v:''},
      {t:'gray',  v:'  "Break things. Understand them. Build better ones."'},
    ],
    'books.txt': [
      {t:'green', v:'# Recommended Reading'},
      {t:'empty', v:''},
      {t:'blue', v:'1. Linux Basics for Hackers'},
      {t:'gray', v:'   — OccupyTheWeb'},
      {t:'plain', v:"   Perfect starting point. Linux from a hacker's perspective."},
      {t:'empty', v:''},
      {t:'blue', v:'2. Antivirus Bypass Techniques'},
      {t:'gray', v:'   — Nir Yehoshua & Uriel Kosayev'},
      {t:'plain', v:'   Deep dive into AV evasion and malware development.'},
      {t:'empty', v:''},
      {t:'blue', v:'3. Hacking: The Art of Exploitation'},
      {t:'gray', v:'   — Jon Erickson'},
      {t:'plain', v:"   The bible of low-level hacking. Covers shellcoding,"},
      {t:'plain', v:'   buffer overflows, and exploit development from scratch.'},
    ],
    'favourites.txt': [
      {t:'green', v:'# Favourites'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ CTF Categories ]'},
      {t:'kv', k:'#1', v:'pwn — binary exploitation is where the real fun is'},
      {t:'kv', k:'#2', v:'reverse engineering — understanding what the binary hides'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ HTB Favourites ]'},
      {t:'plain', v:'  Linux machines with privilege escalation paths'},
      {t:'plain', v:'  Anything involving binary exploitation or custom services'},
      {t:'empty', v:''},
      {t:'yellow', v:'[ Off Keyboard ]'},
      {t:'kv', k:'reading',  v:'self-improvement · red team tradecraft · fiction'},
      {t:'kv', k:'music',    v:'always on while hacking'},
      {t:'kv', k:'learning', v:'slowly picking up guitar'},
    ],
  }

  const colorMap: Record<string, string> = {
    green:  '#48bb78',
    blue:   '#79b8ff',
    yellow: '#f6c90e',
    gray:   '#8b949e',
    error:  '#f97583',
    plain:  '#c9d1d9',
  }

  function linesToHtml(lines: Line[]): {cls: string, html: string}[] {
    return lines.map(l => {
      if(l.t === 'empty') return {cls:'', html:'&nbsp;'}
      if(l.t === 'kv') return {cls:'', html:`<span style="color:#48bb78">${l.k}</span> : ${l.v}`}
      return {cls:'', html:`<span style="color:${colorMap[l.t] || '#c9d1d9'}">${l.v}</span>`}
    })
  }

  function addLines(newLines: {cls: string, html: string}[]) {
    setLines(prev => [...prev, ...newLines, {cls:'', html:'&nbsp;'}])
  }

  function addPrompt(cmd: string) {
    return {cls:'prompt-line', html:`<span style="color:#e53e3e">$</span> ${cmd}`}
  }

  function run(raw: string) {
    const cmd = raw.trim()
    if(!cmd) return
    setHistory(h => [cmd, ...h])
    setHistIdx(-1)

    const parts = cmd.split(/\s+/)
    const base = parts[0].toLowerCase()
    const flags = parts.slice(1).filter(p => p.startsWith('-')).join('')
    const args = parts.slice(1).filter(p => !p.startsWith('-'))

    if(base === 'clear') { setLines([]); return }

    const prompt = addPrompt(cmd)

    if(base === 'ls') {
      const showHidden = flags.includes('a')
      const showLong = flags.includes('l')
      const allFiles = showHidden
        ? [...Object.entries(hiddenFiles), ...Object.entries(visibleFiles)]
        : Object.entries(visibleFiles)

      if(showLong) {
        const total = showHidden ? '72K' : '48K'
        const rows: {cls:string, html:string}[] = [
          prompt,
          {cls:'', html:`<span style="color:#8b949e">total ${total}</span>`},
        ]
        if(showHidden) {
          rows.push({cls:'', html:`drwxr-xr-x  2 b3ta-blocker b3ta-blocker 4.0K ${dateStr} <span style="color:#79b8ff">.</span>`})
          rows.push({cls:'', html:`drwxr-xr-x 18 b3ta-blocker b3ta-blocker 4.0K ${dateStr} <span style="color:#79b8ff">..</span>`})
        }
        allFiles.forEach(([name, meta]) => {
          const perm = (meta as {size:string,isDir?:boolean}).isDir ? 'drwxr-xr-x' : '-rw-r--r--'
          const col = (meta as {size:string,isDir?:boolean}).isDir ? '#79b8ff' : name.startsWith('.') ? '#8b949e' : '#48bb78'
          rows.push({cls:'', html:`${perm}  1 b3ta-blocker b3ta-blocker ${meta.size} ${dateStr} <span style="color:${col}">${name}</span>`})
        })
        addLines(rows)
      } else {
        const names = allFiles.map(([name, meta]) => {
          const col = (meta as {size:string,isDir?:boolean}).isDir ? '#79b8ff' : name.startsWith('.') ? '#8b949e' : '#48bb78'
          return `<span style="color:${col}">${name}</span>`
        }).join('    ')
        addLines([prompt, {cls:'', html:names}])
      }
    } else if(base === 'cat') {
      const file = args[0]
      if(!file) addLines([prompt, {cls:'', html:'<span style="color:#f97583">cat: missing file operand</span>'}])
      else if(file === '.bash_history') addLines([prompt, {cls:'', html:'<span style="color:#f97583">cat: .bash_history: Permission denied</span>'}])
      else if(file === '.bashrc' || file === '.profile') addLines([prompt, {cls:'', html:`<span style="color:#8b949e"># ${file} — system file, nothing interesting here.</span>`}])
      else if(fileContents[file]) addLines([prompt, ...linesToHtml(fileContents[file])])
      else addLines([prompt, {cls:'', html:`<span style="color:#f97583">cat: ${file}: No such file or directory</span>`}])
    } else if(base === 'whoami') {
      addLines([prompt, {cls:'', html:'b3ta-blocker'}])
    } else if(base === 'pwd') {
      addLines([prompt, {cls:'', html:'/home/b3ta-blocker'}])
    } else if(base === 'uname') {
      addLines([prompt, {cls:'', html:'B3TA-OS 6.1.0 #1 SMP HTB TryHackMe pwn.college x86_64 GNU/Linux'}])
    } else if(base === 'id') {
      addLines([prompt, {cls:'', html:'uid=1337(b3ta-blocker) gid=1337(b3ta-blocker) groups=1337(b3ta-blocker),4(adm),27(sudo),1000(red-team)'}])
    } else if(base === 'date') {
      addLines([prompt, {cls:'', html:`${dateStr} ${timeStr}`}])
    } else if(base === 'echo') {
      addLines([prompt, {cls:'', html:parts.slice(1).join(' ')}])
    } else if(base === 'sudo') {
      addLines([prompt, {cls:'', html:'<span style="color:#f97583">[sudo] password for b3ta-blocker: </span>'}])
      setTimeout(() => {
        setLines(prev => [...prev, {cls:'', html:'<span style="color:#f97583">sudo: permission denied — nice try though 😄</span>'}, {cls:'', html:'&nbsp;'}])
      }, 800)
      return
    } else if(['rm','dd','mkfs','chmod','chown'].includes(base)) {
      addLines([prompt, {cls:'', html:`<span style="color:#f97583">${base}: permission denied — this is a controlled environment</span>`}])
    } else if(base === 'help') {
      addLines([prompt, ...linesToHtml([
        {t:'green', v:'Available commands:'},
        {t:'empty', v:''},
        {t:'plain', v:'  whoami              — who is B3TA-BLOCKER'},
        {t:'plain', v:'  id                  — user and group info'},
        {t:'plain', v:'  ls                  — list files'},
        {t:'plain', v:'  cat <file>          — read a file'},
        {t:'plain', v:'  pwd                 — current directory'},
        {t:'plain', v:'  uname               — system info'},
        {t:'plain', v:'  date                — current date and time'},
        {t:'plain', v:'  echo <text>         — print text'},
        {t:'plain', v:'  clear               — clear terminal'},
        {t:'plain', v:'  help                — show this message'},
        {t:'empty', v:''},
        {t:'gray',  v:'Files: setup.txt  goals.txt  books.txt  favourites.txt'},
      ])])
    } else {
      addLines([prompt, {cls:'', html:`<span style="color:#f97583">bash: ${cmd}: command not found</span>`}])
    }
  }

  useEffect(() => {
    if(outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [lines])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if(e.key === 'Escape') setFullscreen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if(closed) return (
    <div
      onClick={() => setClosed(false)}
      style={{display:'flex', alignItems:'center', gap:'8px', background:'#161b22', border:'1px solid #30363d', borderRadius:'8px', padding:'8px 16px', cursor:'pointer', fontFamily:'monospace', fontSize:'13px'}}
    >
      <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#ff5f56'}}></div>
      <span style={{color:'#8b949e'}}>b3ta-blocker@archive:~ (click to reopen)</span>
    </div>
  )

  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'relative',
      inset: fullscreen ? 0 : 'auto',
      zIndex: fullscreen ? 9999 : 'auto',
      background:'#0d1117',
      border:'1px solid #30363d',
      borderRadius: fullscreen ? '0' : '8px',
      overflow:'hidden',
      fontFamily:'monospace',
      fontSize:'13px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{background:'#161b22', padding:'10px 16px', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #30363d', userSelect:'none', flexShrink: 0}}>
        <div onClick={() => setClosed(true)} style={{width:'12px', height:'12px', borderRadius:'50%', background:'#ff5f56', cursor:'pointer'}}></div>
        <div onClick={() => setMinimized(m => !m)} style={{width:'12px', height:'12px', borderRadius:'50%', background:'#ffbd2e', cursor:'pointer'}}></div>
        <div onClick={() => { setFullscreen(f => !f); setTimeout(() => inputRef.current?.focus(), 100) }} style={{width:'12px', height:'12px', borderRadius:'50%', background:'#27c93f', cursor:'pointer'}}></div>
        <span style={{color:'#8b949e', fontSize:'12px', flex:1, textAlign:'center'}}>b3ta-blocker@archive:~</span>
      </div>

      {/* Output */}
      {!minimized && (
        <div
          ref={outputRef}
          onClick={() => inputRef.current?.focus()}
          style={{
            padding:'16px',
            flex: 1,
            minHeight: fullscreen ? 0 : '300px',
            maxHeight: fullscreen ? undefined : '500px',
            overflowY:'auto',
            color:'#c9d1d9',
            cursor:'text',
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{margin:'2px 0', lineHeight:'1.7', whiteSpace:'pre', display: l.cls === 'prompt-line' ? 'flex' : 'block', alignItems:'center', gap:'8px'}} dangerouslySetInnerHTML={{__html: l.html}} />
          ))}
        </div>
      )}

      {/* Input */}
      {!minimized && (
        <div style={{padding:'8px 16px 16px', borderTop:'1px solid #30363d', flexShrink: 0, background:'#0d1117'}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <span style={{color:'#e53e3e'}}>$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if(e.key === 'Enter') { run(input); setInput('') }
                else if(e.key === 'ArrowUp') { e.preventDefault(); if(histIdx < history.length-1) { const i = histIdx+1; setHistIdx(i); setInput(history[i]) } }
                else if(e.key === 'ArrowDown') { e.preventDefault(); if(histIdx > 0) { const i = histIdx-1; setHistIdx(i); setInput(history[i]) } else { setHistIdx(-1); setInput('') } }
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="type a command..."
              style={{background:'transparent', border:'none', outline:'none', color:'#c9d1d9', fontFamily:'monospace', fontSize:'13px', flex:1, caretColor:'#e53e3e'}}
            />
          </div>
        </div>
      )}
    </div>
  )
}
