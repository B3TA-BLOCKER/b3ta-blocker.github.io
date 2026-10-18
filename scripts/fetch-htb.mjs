// Run at BUILD time (GitHub Actions or locally). Needs env var HTB_APP_TOKEN.
// Writes public/htb-data/<Machine>.json (+ public/htb-data/avatars/*), which
// BoxInfoCard loads as static files. Nothing secret ends up in those files.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

// Extra machines to always fetch (optional). Machines used in your posts via
// htbMachine="Name" are discovered automatically, so you normally never edit this.
const EXTRA_MACHINES = [];

// Scan your content for htbMachine="..." so every card gets data without touching this file.
async function discoverMachines(dir = "data") {
  const found = new Set();
  try {
    const files = await readdir(dir, { recursive: true });
    for (const f of files) {
      if (!/\.(mdx?|tsx?)$/i.test(f)) continue;
      const text = await readFile(dir + "/" + f, "utf8").catch(() => "");
      for (const m of text.matchAll(/htbMachine\s*=\s*["']([A-Za-z0-9_-]+)["']/g)) found.add(m[1]);
    }
  } catch (e) {
    console.warn("Could not scan '" + dir + "' for htbMachine:", e.message);
  }
  return found;
}

const ORIGIN = "https://labs.hackthebox.com";
const API = ORIGIN + "/api/v4";
const token = process.env.HTB_APP_TOKEN;
if (!token) {
  console.warn("HTB_APP_TOKEN not set - skipping HTB fetch (cards use their static props).");
  process.exit(0);
}

const HEADERS = {
  Authorization: "Bearer " + token,
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; BoxInfoCard/1.0)",
};

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(url + " -> HTTP " + res.status);
  return res.json();
}
const v4 = (path) => getJson(API + path);

async function firstWorking(urls) {
  for (const url of urls) {
    try {
      return { url, data: await getJson(url) };
    } catch (e) {
      console.warn("  miss:", e.message);
    }
  }
  return null;
}

// ---- radar -----------------------------------------------------------------
const ALIASES = {
  enumeration: ["enum", "enumeration"],
  realLife: ["real", "reallife", "real_life"],
  cve: ["cve"],
  customExploitation: ["custom", "customexploitation", "custom_exploitation"],
  ctfLike: ["ctf", "ctflike", "ctf_like"],
};

function asRadar(o) {
  const r = {};
  for (const [key, names] of Object.entries(ALIASES)) {
    const k = Object.keys(o).find((x) => names.includes(x.toLowerCase()));
    const n = k === undefined ? NaN : Number(o[k]);
    if (Number.isNaN(n)) return null;
    r[key] = n;
  }
  return r;
}

function findRadars(node, path = "", out = []) {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const r = asRadar(node);
    if (r) out.push({ path, radar: r });
    else for (const [k, v] of Object.entries(node)) findRadars(v, path + "/" + k, out);
  } else if (Array.isArray(node)) node.forEach((v, i) => findRadars(v, path + "/" + i, out));
  return out;
}

// ---- difficulty histogram --------------------------------------------------
// The profile endpoint carries the "Rated Difficulty" counters, easiest -> hardest.
const FEEDBACK_ORDER = [
  "counterCake",
  "counterVeryEasy",
  "counterEasy",
  "counterTooEasy",
  "counterMedium",
  "counterBitHard",
  "counterHard",
  "counterTooHard",
  "counterExHard",
  "counterBrainFuck",
];

// ---- first blood -----------------------------------------------------------
async function bloodInfo(blood, label) {
  if (!blood) return undefined;
  const user = blood.user ?? blood;
  const id = user.id;
  if (!id || !user.name) {
    console.warn("  " + label + ": unexpected shape, keys =", Object.keys(blood));
    return undefined;
  }
  const out = {
    time: parseBloodTime(blood),
    name: user.name,
    htbProfileUrl: "https://app.hackthebox.com/users/" + id,
  };
  let avatarPath = user.avatar || user.avatar_thumb;
  try {
    const p = (await v4("/user/profile/basic/" + id)).profile ?? {};
    avatarPath = avatarPath || p.avatar || p.avatar_thumb;
    if (typeof p.rank === "string" && Number.isNaN(Number(p.rank))) out.title = p.rank;
    const pos = p.ranking ?? (Number.isNaN(Number(p.rank)) ? undefined : p.rank);
    if (pos !== undefined && pos !== null && pos !== 0) out.rank = String(pos);
    if (p.respects !== undefined) out.respects = Number(p.respects);
    if (p.points !== undefined) out.points = Number(p.points);
  } catch (e) {
    console.warn("  " + label + " profile miss:", e.message);
  }
  if (avatarPath) {
    try {
      const url = avatarPath.startsWith("http") ? avatarPath : ORIGIN + avatarPath;
      const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const ext = (url.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i) || [".png"])[0];
      await mkdir("public/htb-data/avatars", { recursive: true });
      await writeFile("public/htb-data/avatars/" + id + ext, Buffer.from(await res.arrayBuffer()));
      out.avatarUrl = "/htb-data/avatars/" + id + ext;
    } catch (e) {
      console.warn("  " + label + " avatar miss:", e.message);
    }
  }
  return out;
}

// ---- metadata helpers -------------------------------------------------------
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(v) {
  if (typeof v !== "string") return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return String(d.getUTCDate()).padStart(2, "0") + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}
function findDateByKey(obj, re) {
  for (const [k, v] of Object.entries(obj)) {
    if (re.test(k)) {
      const out = fmtDate(v);
      if (out) return out;
    }
  }
  return undefined;
}
function parseBloodTime(b) {
  const m = String(b?.blood_difficulty ?? "").match(/(\d+)\s*d\D*(\d+)\s*h\D*(\d+)\s*m\D*(\d+)\s*s/i);
  if (!m) return undefined;
  const [d, h, mi, se] = m.slice(1).map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  return pad(d * 24 + h) + ":" + pad(mi) + ":" + pad(se);
}

// ---- main ------------------------------------------------------------------
await mkdir("public/htb-data", { recursive: true });

const MACHINES = [...new Set([...EXTRA_MACHINES, ...(await discoverMachines())])];
console.log("Machines to fetch:", MACHINES.join(", ") || "(none)");

for (const name of MACHINES) {
  console.log("==", name);
  try {
    const profile = await v4("/machine/profile/" + encodeURIComponent(name));
    const info = profile.info ?? profile;
    const id = info.id;
    if (!id) throw new Error("no machine id in profile");

    // difficulty bars
    const fb = info.feedbackForChart;
    let bars;
    if (fb && typeof fb === "object") {
      bars = FEEDBACK_ORDER.map((k) => Number(fb[k] ?? 0));
    } else {
      console.warn("  feedbackForChart missing; info keys =", Object.keys(info));
    }

    // radar (unofficial endpoints - first one that answers wins)
    const matrix = await firstWorking([
      API + "/machine/graph/matrix/" + id,
      API + "/machine/matrix/" + id,
      ORIGIN + "/api/machines/get/matrix/" + id,
    ]);
    let radars = matrix ? findRadars(matrix.data) : [];
    const max = Math.max(0, ...radars.flatMap((x) => Object.values(x.radar)));
    const f = max > 0 && max <= 10 ? 10 : 1;
    radars = radars.map((x) => ({
      path: x.path,
      radar: Object.fromEntries(Object.entries(x.radar).map(([k, v]) => [k, Math.min(100, v * f)])),
    }));
    const machine = radars.find((r) => /maker|machine/i.test(r.path)) ?? radars[0];
    const average =
      radars.find((r) => r !== machine && /user|aggregate|average|community/i.test(r.path)) ??
      radars.find((r) => r !== machine);
    console.log("  radar source:", matrix?.url ?? "NONE FOUND");
    console.log("  radars found:", JSON.stringify(radars));
    if (!radars.length && matrix) console.log("  raw matrix:", JSON.stringify(matrix.data).slice(0, 1500));

    console.log("  profile keys:", Object.keys(info).join(", "));
    // Authors: HTB exposes the main author as `maker` and a co-author as `maker2`
    // (some profiles may also carry a `makers` array). Collect them all, without duplicates.
    const makerCandidates = [info.maker, info.maker2, ...(Array.isArray(info.makers) ? info.makers : [])];
    if (!info.maker && info.creator) makerCandidates.push(info.creator);
    const seen = new Set();
    const creators = [];
    for (const m of makerCandidates) {
      if (!m || !m.name || seen.has(m.name)) continue;
      seen.add(m.name);
      creators.push({
        name: m.name,
        htbProfileUrl: m.id ? "https://app.hackthebox.com/users/" + m.id : undefined,
      });
    }
    const creator = creators[0];
    const meta = {
      difficulty: typeof info.difficultyText === "string" ? info.difficultyText : undefined,
      os: typeof info.os === "string" ? info.os : undefined,
      releaseDate: fmtDate(info.release) ?? findDateByKey(info, /^release/i),
      retireDate: findDateByKey(info, /retire/i),
      creator,
      creators,
    };
    console.log("  meta:", JSON.stringify(meta));

    const userBlood = await bloodInfo(info.user_blood, "userBlood");
    const rootBlood = await bloodInfo(info.root_blood, "rootBlood");

    await writeFile(
      "public/htb-data/" + name + ".json",
      JSON.stringify({
        ...meta,
        difficultyRatingBars: bars,
        radar: machine?.radar,
        radarAverage: average?.radar,
        userBlood,
        rootBlood,
      })
    );
    console.log("  OK", { bars, radar: !!machine, avg: !!average, userBlood: !!userBlood, rootBlood: !!rootBlood });
  } catch (e) {
    console.warn("  FAILED", name, e.message);
  }
}
