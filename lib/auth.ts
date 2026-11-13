import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { GUEST_COOKIE, SESSION_COOKIE } from "./config";
import { db } from "./db";
import type { Role, User } from "./types";
import { can, type Action } from "./permissions";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/** SESSION_SECRET from env, else a random secret persisted beside the data file. */
function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
  const file = path.join(dir, ".secret");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  fs.mkdirSync(dir, { recursive: true });
  const s = randomBytes(32).toString("hex");
  fs.writeFileSync(file, s);
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

export async function createSession(userId: string) {
  const exp = Date.now() + SESSION_MS;
  const payload = `${userId}.${exp}`;
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user for this request, or null. Re-reads the DB so suspensions apply immediately. */
export const getUser = cache(async (): Promise<User | null> => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [userId, exp, mac] = raw.split(".");
  if (!userId || !exp || !mac) return null;
  const expected = sign(`${userId}.${exp}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  const user = db().users.find((u) => u.id === userId);
  if (!user || user.suspended) return null;
  return user;
});

/** Guards pages: sends guests to /login and wrong roles home. */
export async function requireUser(roles?: Role[], next = "/"): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role)) redirect("/");
  return user;
}

/** Guards server actions. Throws so a forged POST cannot slip through. */
export async function requireCan(action: Action): Promise<User> {
  const user = await getUser();
  if (!user) throw new Error("Please sign in first.");
  if (!can(user, action)) throw new Error("You don't have permission to do that.");
  return user;
}

export const hasBadge = (u: Pick<User, "subscribedUntil">) => u.subscribedUntil > Date.now();

/** Stable id for de-duplicating views: the user, or an anonymous cookie id for guests. */
export async function viewerId(): Promise<string> {
  const user = await getUser();
  if (user) return user.id;
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return `g:${existing}`;
  const id = randomBytes(12).toString("hex");
  store.set(GUEST_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  return `g:${id}`;
}
