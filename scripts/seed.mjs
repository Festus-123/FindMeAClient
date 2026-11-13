// Adds sample clients and live sample ads (with online photos) to data/db.json.
// Re-run any time: it replaces its own samples and restarts their 24-96h clocks.
// Uses Neon (TEST_DATABASE_URL in .env.local) when set, else data/db.json. Stop the dev server first
// (it keeps a copy in memory and would write its own version back).
// Sample client logins use the password below.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";

const FILE = path.join(process.cwd(), "data", "db.json");
const PASSWORD = "Sample123!";
const img = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop`;
const H = 3600_000;

const clients = [
  { name: "Brightwave Studio", email: "brightwave@sample.test", pro: true },
  { name: "Okafor & Sons Farms", email: "okafor@sample.test", pro: false },
  { name: "Lagos Events Co.", email: "events@sample.test", pro: true },
];

const ads = [
  { c: 0, cat: "Web & Software", title: "Frontend developer for a fintech dashboard", img: "1498050108023-c5249f4df085", hours: 96, left: 80, views: 214,
    desc: "We are building a customer dashboard for a payments startup and need a React developer who cares about clean, fast interfaces. Two-month contract with a chance to extend.",
    kw: ["react", "typescript", "frontend", "fintech"], d: [["Location", "Lagos / Remote"], ["Pay / Budget", "₦450k per month"], ["Job type", "Contract"], ["Experience needed", "2+ years"]] },
  { c: 0, cat: "Design & Creative", title: "Brand designer to refresh our identity", img: "1522202176988-66273c2fd55f", hours: 72, left: 50, views: 168,
    desc: "A growing agency is looking for a brand designer to rework our logo, colours and social templates. Bring a portfolio that shows real identity work.",
    kw: ["branding", "logo", "figma", "design"], d: [["Location", "Abuja"], ["Pay / Budget", "₦300k project"], ["Deadline", "3 weeks"]] },
  { c: 2, cat: "Photography & Video", title: "Photographer needed for a 2-day product shoot", img: "1516035069371-29a1b244cc32", hours: 48, left: 30, views: 131,
    desc: "We need a photographer with their own gear for a clean product shoot: 40 items, white background plus a few lifestyle frames. Edited files due within a week.",
    kw: ["photography", "product", "studio", "editing"], d: [["Location", "Ikeja, Lagos"], ["Pay / Budget", "₦120k flat"], ["Deadline", "Next Friday"]] },
  { c: 1, cat: "Farming & Agriculture", title: "Harvest hands wanted: 20 seasonal workers", img: "1500937386664-56d1dfef3854", hours: 96, left: 90, views: 96,
    desc: "Our family farm is harvesting maize and needs 20 hard-working hands for two weeks. Meals are provided and pay is weekly. Supervisors with experience get a bonus.",
    kw: ["harvest", "farm", "seasonal", "labour"], d: [["Location", "Ogbomosho"], ["Pay / Budget", "₦25k per week"], ["People needed", "20"], ["Job type", "Seasonal"]] },
  { c: 0, cat: "Writing & Translation", title: "Content writer for a weekly business newsletter", img: "1455390582262-044cdead277a", hours: 72, left: 40, views: 77,
    desc: "Short, sharp business stories every week. You research, write 800 words and work with an editor. Great fit for a journalist or a strong freelance writer.",
    kw: ["writing", "newsletter", "content", "editing"], d: [["Location", "Remote"], ["Pay / Budget", "₦60k per issue"], ["Job type", "Recurring"]] },
  { c: 1, cat: "Trades & Construction", title: "Site supervisor for a duplex build", img: "1503387762-592deb58ef4e", hours: 96, left: 70, views: 143,
    desc: "We are putting up a four-bedroom duplex and need a supervisor who can read plans, manage a crew of ten and report progress weekly.",
    kw: ["construction", "supervisor", "building", "plans"], d: [["Location", "Ibadan"], ["Pay / Budget", "₦280k per month"], ["Experience needed", "5+ years"]] },
  { c: 0, cat: "Tutoring & Education", title: "Maths and Physics tutor for WAEC students", img: "1524178232363-1fb2b075b655", hours: 72, left: 60, views: 89,
    desc: "Evening classes for final-year students. You plan the lessons, run weekly mock tests and share progress with parents.",
    kw: ["tutor", "maths", "physics", "waec"], d: [["Location", "Yaba / Online"], ["Pay / Budget", "₦8k per session"], ["Requirements", "Degree in a related field"]] },
  { c: 2, cat: "Delivery & Logistics", title: "Warehouse packers and dispatch riders", img: "1586528116311-ad8dd3c8310d", hours: 48, left: 20, views: 182,
    desc: "A fulfilment centre is hiring packers for the day shift and riders with their own bikes. Steady daily orders, weekly pay.",
    kw: ["warehouse", "dispatch", "riders", "packing"], d: [["Location", "Apapa"], ["Pay / Budget", "₦90k per month"], ["People needed", "12"]] },
  { c: 2, cat: "Beauty & Fashion", title: "Hair stylist to join a busy city salon", img: "1560066984-138dadb4c035", hours: 72, left: 55, views: 120,
    desc: "Our salon is growing and needs a stylist skilled in braids, cuts and colour. Clients are already booked, you bring the talent.",
    kw: ["stylist", "salon", "hair", "braids"], d: [["Location", "Victoria Island"], ["Pay / Budget", "Commission + base"], ["Job type", "Full time"]] },
  { c: 2, cat: "Events & Hospitality", title: "Event coordinator for a 300-guest conference", img: "1511578314322-379afb476865", hours: 96, left: 85, views: 154,
    desc: "Plan and run a two-day tech conference: vendors, schedule, guest flow and on-the-day crew. Strong organisers only.",
    kw: ["events", "coordinator", "conference", "planning"], d: [["Location", "Eko Hotel, Lagos"], ["Pay / Budget", "₦350k"], ["Deadline", "Event in 6 weeks"]] },
  { c: 0, cat: "Other", title: "Virtual assistant for a founder-led team", img: "1542744173-8e7e53415bb0", hours: 48, left: 36, views: 61,
    desc: "Calendar, inbox, travel and light research for a busy founder. Reliable, discreet and quick to reply.",
    kw: ["assistant", "admin", "remote", "founder"], d: [["Location", "Remote"], ["Pay / Budget", "₦150k per month"], ["Job type", "Part time"]] },
  { c: 1, cat: "Other", title: "Office and home cleaners on weekly rotation", img: "1581578731548-c64695cc6952", hours: 24, left: 14, views: 45,
    desc: "A cleaning service is adding people to its weekly rota for offices and apartments. Training is provided and supplies are covered.",
    kw: ["cleaning", "housekeeping", "weekly"], d: [["Location", "Lekki"], ["Pay / Budget", "₦70k per month"], ["People needed", "6"]] },
];

function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - ys) / 86_400_000 + 1) / 7)).padStart(2, "0")}`;
}

// Reads .env.local (Next loads it for the app; this script is plain node).
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const PG_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const KINDS = ["users", "ads", "threads", "notifications", "payments"];
let pool = null;
const empty = () => ({ users: [], ads: [], threads: [], notifications: [], payments: [] });

async function loadDb() {
  if (!PG_URL) return JSON.parse(fs.readFileSync(FILE, "utf8"));
  const url = new URL(PG_URL);
  url.searchParams.delete("channel_binding");
  if (url.searchParams.get("sslmode") === "require") url.searchParams.set("sslmode", "verify-full");
  pool = new pg.Pool({ connectionString: url.toString(), max: 2 });
  await pool.query("create table if not exists fmc_rows (kind text not null, id text not null, data jsonb not null, primary key (kind, id))");
  const { rows } = await pool.query("select kind, id, data from fmc_rows");
  const out = empty();
  for (const r of rows) out[r.kind].push(r.data);
  return out;
}

async function saveDb(db) {
  if (!pool) return fs.writeFileSync(FILE, JSON.stringify(db));
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query("delete from fmc_rows");
    for (const kind of KINDS) for (const row of db[kind]) await c.query("insert into fmc_rows (kind, id, data) values ($1, $2, $3::jsonb)", [kind, row.id, JSON.stringify(row)]);
    await c.query("commit");
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
    await pool.end();
  }
}

const db = await loadDb();
// First run against an empty Postgres: start from the local file (admin account etc.).
if (pool && !db.users.length && fs.existsSync(FILE)) Object.assign(db, JSON.parse(fs.readFileSync(FILE, "utf8")));
const emails = new Set(clients.map((c) => c.email));
const old = new Set(db.users.filter((u) => emails.has(u.email)).map((u) => u.id));
db.users = db.users.filter((u) => !old.has(u.id));
db.ads = db.ads.filter((a) => !old.has(a.ownerId));

const now = Date.now();
const users = clients.map((c) => {
  const salt = randomBytes(16).toString("hex");
  return {
    id: randomUUID(), name: c.name, email: c.email, role: "client", salt,
    passwordHash: scryptSync(PASSWORD, salt, 64).toString("hex"),
    createdAt: now, suspended: false, follows: [],
    subscribedUntil: c.pro ? now + 30 * 24 * H : 0, freeAdUsed: true, scores: {},
  };
});
db.users.push(...users);

const day = new Date().toISOString().slice(0, 10);
for (const a of ads) {
  const startsAt = now - (a.hours - a.left) * H;
  const expiresAt = now + a.left * H;
  db.ads.push({
    id: randomUUID(), ownerId: users[a.c].id, cohostIds: [], title: a.title, cause: a.title,
    category: a.cat, description: a.desc, details: a.d.map(([label, value]) => ({ label, value })),
    keywords: a.kw, image: img(a.img), adoptable: false, status: "live", hours: a.hours, price: 1000,
    createdAt: startsAt, startsAt, expiresAt, purgeAt: expiresAt + 5 * 24 * H,
    views: a.views, viewsByDay: { [day]: Math.round(a.views / 4) }, applies: 0, shares: 0,
    viewedBy: [], deliveredTo: [],
  });
}

const week = weekKey();
users[0].scores[week] = 420;
users[2].scores[week] = 310;
users[1].scores[week] = 150;

await saveDb(db);
console.log(`Seeded ${ads.length} ads for ${users.length} clients. Sample login: ${clients[0].email} / ${PASSWORD}`);
