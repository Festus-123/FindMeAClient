import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { Pool } from "pg";
import type { DB } from "./types";

/**
 * Tiny JSON-file store so the app runs with zero setup.
 * Every read/write goes through this module, so swapping in Postgres later only touches here.
 */
const DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/**
 * Postgres (Neon) when a connection string is set, otherwise the local JSON file.
 * For now the test database is used (TEST_DATABASE_URL); DATABASE_URL takes over in production.
 * The app keeps a live copy in memory (so every read stays synchronous) and writes every change
 * through to Postgres, one row per record in `fmc_rows`.
 */
const PG_URL = (process.env.NODE_ENV === "production" ? process.env.DATABASE_URL : undefined) ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const KINDS = ["users", "ads", "threads", "notifications", "payments"] as const;
type Kind = (typeof KINDS)[number];

interface Pg {
  pool: Pool;
  /** "kind:id" → the JSON last written, so only changed rows are sent. */
  written: Map<string, string>;
  chain: Promise<void>;
}

const g = globalThis as unknown as { __fmcDb?: DB; __fmcPg?: Pg };

async function pgConnect(): Promise<DB | null> {
  // channel_binding is not supported by node-postgres; TLS (sslmode=require) is still enforced.
  const url = new URL(PG_URL as string);
  url.searchParams.delete("channel_binding");
  if (url.searchParams.get("sslmode") === "require") url.searchParams.set("sslmode", "verify-full");
  const pool = new Pool({ connectionString: url.toString(), max: 3 });
  const pg: Pg = { pool, written: new Map(), chain: Promise.resolve() };
  await pool.query(
    "create table if not exists fmc_rows (kind text not null, id text not null, data jsonb not null, primary key (kind, id))",
  );
  await pool.query("create table if not exists fmc_files (name text primary key, type text not null, data bytea not null)");
  const { rows } = await pool.query<{ kind: Kind; id: string; data: Record<string, unknown> }>("select kind, id, data from fmc_rows");
  g.__fmcPg = pg;
  if (rows.length === 0) return null;
  const loaded = empty();
  for (const r of rows) {
    (loaded[r.kind] as unknown[]).push(r.data);
    pg.written.set(`${r.kind}:${r.id}`, JSON.stringify(r.data));
  }
  return loaded;
}

/** Serialises the whole store now, then sends only what changed since the last write. */
function pgSave(store: DB) {
  const pg = g.__fmcPg;
  if (!pg) return;
  const next = new Map<string, { kind: Kind; id: string; json: string }>();
  for (const kind of KINDS) {
    for (const row of store[kind] as { id: string }[]) next.set(`${kind}:${row.id}`, { kind, id: row.id, json: JSON.stringify(row) });
  }
  pg.chain = pg.chain
    .then(async () => {
      const upserts = [...next].filter(([k, v]) => pg.written.get(k) !== v.json);
      const deletes = [...pg.written.keys()].filter((k) => !next.has(k));
      if (!upserts.length && !deletes.length) return;
      const client = await pg.pool.connect();
      try {
        await client.query("begin");
        for (const [, v] of upserts) {
          await client.query(
            "insert into fmc_rows (kind, id, data) values ($1, $2, $3::jsonb) on conflict (kind, id) do update set data = excluded.data",
            [v.kind, v.id, v.json],
          );
        }
        for (const k of deletes) {
          const i = k.indexOf(":");
          await client.query("delete from fmc_rows where kind = $1 and id = $2", [k.slice(0, i), k.slice(i + 1)]);
        }
        await client.query("commit");
        for (const [k, v] of upserts) pg.written.set(k, v.json);
        for (const k of deletes) pg.written.delete(k);
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    })
    .catch((e) => console.error("[db] could not save to Postgres:", e));
}

// Top-level await: connect and load once per server process (not again on hot reloads).
// In development an unreachable database (offline, DNS failure, paused Neon project) falls back to the
// local JSON file instead of crashing every page. In production the error still surfaces.
const remote =
  !g.__fmcDb && PG_URL
    ? await pgConnect().catch((e) => {
        if (process.env.NODE_ENV === "production") throw e;
        console.warn("[db] Postgres unreachable, using local data/db.json instead:", (e as Error).message);
        return null;
      })
    : null;

function empty(): DB {
  return { users: [], ads: [], threads: [], notifications: [], payments: [] };
}

export const uid = () => randomUUID();

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function seedAdmin(db: DB) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (db.users.some((u) => u.email === email)) return;
  const salt = randomBytes(16).toString("hex");
  db.users.push({
    id: uid(),
    name: "Admin",
    email,
    role: "admin",
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: Date.now(),
    suspended: false,
    follows: [],
    subscribedUntil: 0,
    freeAdUsed: true,
    scores: {},
  });
}

function load(): DB {
  let db = empty();
  if (remote) {
    db = { ...empty(), ...remote };
  } else if (!g.__fmcPg && fs.existsSync(DB_FILE)) {
    try {
      db = { ...empty(), ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
    } catch {
      // Corrupt file: keep a copy instead of silently overwriting it.
      fs.copyFileSync(DB_FILE, `${DB_FILE}.corrupt-${Date.now()}`);
    }
  }
  seedAdmin(db);
  return db;
}

/** Writes via a temp file so a crash mid-write cannot corrupt the store. */
export function save() {
  if (!g.__fmcDb) return;
  if (g.__fmcPg) return pgSave(g.__fmcDb);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(g.__fmcDb));
    fs.renameSync(tmp, DB_FILE);
  } catch (e) {
    // Read-only hosts (serverless) cannot keep a file; set a database URL there.
    console.error("[db] could not write data/db.json (set TEST_DATABASE_URL or DATABASE_URL on this host):", e);
  }
}

let syncing: Promise<void> | null = null;

/**
 * Serverless hosts run several copies of the app, each with its own in-memory data. Before a request
 * reads anything, pull the latest rows from Postgres so every copy sees the same data. A no-op locally.
 */
export function syncDb(): Promise<void> {
  const pg = g.__fmcPg;
  if (!pg || !g.__fmcDb || process.env.NODE_ENV !== "production") return Promise.resolve();
  syncing ??= (async () => {
    try {
      await pg.chain; // let this copy's own pending writes land first
      const { rows } = await pg.pool.query<{ kind: Kind; id: string; data: Record<string, unknown> }>("select kind, id, data from fmc_rows");
      const fresh = empty();
      const written = new Map<string, string>();
      for (const r of rows) {
        (fresh[r.kind] as unknown[]).push(r.data);
        written.set(`${r.kind}:${r.id}`, JSON.stringify(r.data));
      }
      g.__fmcDb = fresh;
      pg.written = written;
    } catch (e) {
      console.error("[db] could not refresh from Postgres:", e);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

/** Uploaded images: in Postgres when it is configured (hosts have no writable disk), else on disk. */
export async function storeUpload(name: string, type: string, bytes: Buffer): Promise<void> {
  if (g.__fmcPg) {
    await g.__fmcPg.pool.query(
      "insert into fmc_files (name, type, data) values ($1, $2, $3) on conflict (name) do update set type = excluded.type, data = excluded.data",
      [name, type, bytes],
    );
    return;
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), bytes);
}

export async function readUpload(name: string): Promise<Buffer | null> {
  if (g.__fmcPg) {
    const { rows } = await g.__fmcPg.pool.query<{ data: Buffer }>("select data from fmc_files where name = $1", [name]);
    return rows[0]?.data ?? null;
  }
  const file = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name);
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

export async function removeUpload(name: string): Promise<void> {
  try {
    if (g.__fmcPg) await g.__fmcPg.pool.query("delete from fmc_files where name = $1", [name]);
    else fs.rmSync(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), { force: true });
  } catch {
    // A leftover image is harmless.
  }
}

/** Moves expired ads to "expired" and purges ads that outlived their 5-day grace. */
function sweep(db: DB): boolean {
  const now = Date.now();
  let changed = false;
  for (const ad of db.ads) {
    if (ad.status === "live" && ad.expiresAt <= now) {
      ad.status = "expired";
      changed = true;
    }
  }
  const stale = (a: DB["ads"][number]) =>
    (a.status === "expired" && a.purgeAt <= now) ||
    // Abandoned checkouts are dropped after a day.
    (a.status === "pending_payment" && a.createdAt + 24 * 3600_000 <= now);
  const keep = db.ads.filter((a) => !stale(a));
  if (keep.length !== db.ads.length) {
    const gone = new Set(db.ads.filter(stale).map((a) => a.id));
    db.ads = keep;
    db.threads = db.threads.filter((t) => !gone.has(t.adId));
    db.payments = db.payments.filter((p) => !(p.status === "pending" && p.adId && gone.has(p.adId)));
    changed = true;
  }
  return changed;
}

export function db(): DB {
  if (!g.__fmcDb) {
    g.__fmcDb = load();
    save();
  }
  if (sweep(g.__fmcDb)) save();
  return g.__fmcDb;
}

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** ISO-8601 week key such as "2026-W46". */
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
