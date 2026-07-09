<div align="center">

# 👻 Bukhari's Archive

</div>

### `$ cat identity.txt`

```
role      : Red Teamer / CTF Player / Binary Exploitation Enthusiast
status    : Self-taught, Graduated
focus     : Red Teaming · Malware Research 
site      : https://b3ta-blocker.github.io/
```

---

## `whoami`

I'm Hassaan — Cybersecurity graduate from GIKI, red teamer by interest, exploit dev by aspiration. This repo powers my blog, where I write up boxes I've rooted, bugs I've chased, and tools I'm building along the way. No fluff, no "10 tips for cybersecurity" listicles — just raw process: recon, failure, the moment something finally pops a shell, and what I learned from it.

If you're here from a CV, an interview panel, or just stumbled in from HTB — welcome. Everything documented here happened in isolated labs I own or am explicitly authorized to test.

---

## `ls -la ./content`

**Box & CTF Writeups**
Full attack-chain breakdowns — not just "run this command," but the actual thought process behind each pivot.

**Binary Exploitation & Reverse Engineering**
My primary lane. Notes and progress logs as I move from stack/heap fundamentals toward real CVE reproduction, fuzzing, and (eventually) competitive pwn.

**Dev-Notes**
Behind-the-scenes notes on building this site itself — because a hacker's blog should look like it was built by one, not templated off a theme store.

---

## `stack --list`

```
languages     Python · C · C++ · Bash
tools         Ghidra · GDB · IDA Pro · Burp Suite · Docker
platforms     HackTheBox · TryHackMe · pwn.college
site infra    GitHub Pages + GitHub Actions (CI/CD deploy pipeline)
```

---

## `run --local`

Want to poke at the site source itself:

```bash
git clone https://github.com/B3TA-BLOCKER/b3ta-blocker.github.io.git
cd b3ta-blocker.github.io

# serve however the generator expects — check the repo root for build config
```

---

## `cat ROE.txt` — Rules of Engagement / Disclaimer

Every exploit, walkthrough, and attack chain in this archive was executed against **isolated lab targets** — HTB machines, TryHackMe rooms, or self-hosted VMs I own. Nothing here documents unauthorized access to real systems. Read it, learn from it, don't be an idiot with it.

---
