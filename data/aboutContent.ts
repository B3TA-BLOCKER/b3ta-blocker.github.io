export const skills = {
  languages: ['Python', 'C', 'C++', 'Bash'],
  tools: ['Docker', 'Ghidra', 'GDB', 'IDA Pro', 'Burp Suite'],
  platforms: ['HackTheBox', 'TryHackMe', 'pwn.college'],
}

export const experience = [
  {
    date: '2025',
    role: 'Penetration Tester Intern',
    org: 'VisionX',
    href: 'https://visionx.io',
    bullets: [
      'Performed security testing in simulated environments, including web exploitation (SQLi, XSS, authentication bypass, IDOR).',
      'Conducted Active Directory attack simulations and Linux privilege escalation on lab-based systems.',
      'Solved CTF challenges across web security, binary exploitation, and reverse engineering domains.',
      'Applied reverse engineering and debugging techniques using tools like GDB.',
      'Researched access control vulnerabilities, including UUID-based attack scenarios.',
      'Documented findings and published technical write-ups on Medium and LinkedIn.',
    ],
  },
]

export const education = [
  {
    date: '2022 — 2026',
    role: 'BS in Cyber Security',
    org: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
    href: 'https://giki.edu.pk/',
  },
]

export const certifications = [
  {
    name: 'Practical Junior Penetration Tester (PJPT)',
    issuer: 'TCM Security',
  },
]

export const projects = [
  {
    file: 'inside-job.md',
    name: 'The Inside Job',
    tag: 'FYP 2025–2026',
    desc: 'A hardware-based red team tool using Raspberry Pi Pico that deploys a remote-access agent within seconds. Encrypted C2 on AWS with AES-256 + TLS, stealthy command execution via a Go-based in-memory agent.',
    href: 'https://www.youtube.com/watch?v=dOFkMnDFkJo',
  },
  {
    file: 'pi-ids.md',
    name: 'Raspberry Pi based Intrusion Detection System',
    tag: 'ML / Networking',
    desc: 'A lightweight intrusion detection system on Raspberry Pi using an LSTM model trained on CSE-CIC-IDS 2018 to classify traffic in real time, deployable on edge hardware without dedicated server infrastructure.',
    href: 'https://github.com/B3TA-BLOCKER/Raspberry-Pi-based-Intrusion-Detection-System',
  },
  {
    file: 'cnn-lstm-ad.md',
    name: 'Anomaly Detection Using CNN-LSTM',
    tag: 'Computer Vision',
    desc: 'A video anomaly detection system using CNN-LSTM models deployed on AWS, trained on UCF Crime, UCSD, and UBnormal datasets with federated learning and particle swarm optimization for improved generalization.',
    href: 'https://github.com/danishjavedcodes/Anomalies-Detection-Using-CNN-LSTM.git',
  },
  {
    file: 'ghostlogger.md',
    name: 'GhostLogger',
    tag: 'Windows Internals',
    desc: 'A low-level Windows keylogger that runs invisibly in the background, capturing all keystrokes silently.',
    href: 'https://github.com/B3TA-BLOCKER/GhostLogger',
  },
]

export const community = [
  {
    date: 'Sep 2024 – May 2025',
    role: 'Head — Speed Programming',
    org: 'ACM Student Chapter, GIKI',
  },
  {
    date: 'Oct 2023 – Oct 2024',
    role: 'Sub-Head — Speed Programming & CTF',
    org: 'ACM Student Chapter, GIKI',
  },
  {
    date: 'Sep 2023 – Nov 2023',
    role: 'Programming Instructor',
    org: 'ACM Student Chapter, GIKI',
    note: 'Taught C++ to first-year students',
  },
  {
    date: 'Oct 2022 – Apr 2023',
    role: 'Volunteer',
    org: 'ACM Student Chapter, GIKI',
    note: 'Managed logistics for ICPC finals',
  },
  {
    date: 'Oct 2023 – May 2024',
    role: 'Member',
    org: 'Microsoft Club GIKI',
  },
]
