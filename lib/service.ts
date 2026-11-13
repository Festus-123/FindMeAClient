import "server-only";
import { GRACE_MS, LEADERBOARD_SIZE, SCORE_WEIGHTS } from "./config";
import { dayKey, db, save, uid, weekKey } from "./db";
import type { Ad, Notification, User } from "./types";

export const findAd = (id: string) => db().ads.find((a) => a.id === id);
export const findUser = (id: string) => db().users.find((u) => u.id === id);

export const hostsOf = (ad: Ad) => [ad.ownerId, ...ad.cohostIds];

export function notify(userId: string, text: string, href: string) {
  const n: Notification = { id: uid(), userId, text, href, read: false, at: Date.now() };
  db().notifications.push(n);
}

/**
 * Engagement is only summed into counters. A client's weekly credits live on the user, so they
 * survive after the ad has expired and been purged.
 */
export function credit(ad: Ad, kind: keyof typeof SCORE_WEIGHTS) {
  const week = weekKey();
  for (const id of hostsOf(ad)) {
    const host = findUser(id);
    if (host) host.scores[week] = (host.scores[week] ?? 0) + SCORE_WEIGHTS[kind];
  }
}

/** Takes an ad live now and tells followers of its category. */
export function activateAd(ad: Ad) {
  const now = Date.now();
  ad.status = "live";
  ad.startsAt = now;
  ad.expiresAt = now + ad.hours * 3600_000;
  ad.purgeAt = ad.expiresAt + GRACE_MS;
  ad.deliveredTo = [];
  for (const u of db().users) {
    if (u.role !== "admin" && !u.suspended && u.id !== ad.ownerId && u.follows.includes(ad.category)) {
      notify(u.id, `New ${ad.category} ad: ${ad.title}`, `/ads/${ad.id}`);
    }
  }
  const owner = findUser(ad.ownerId);
  if (owner) owner.freeAdUsed = true;
  save();
}

export function isLive(ad: Ad) {
  return ad.status === "live" && ad.expiresAt > Date.now();
}

/** Ads the client has for a cause that have not been purged (they count toward the exponent). */
export function adsInCause(ownerId: string, cause: string) {
  const key = cause.trim().toLowerCase();
  return db().ads.filter((a) => a.ownerId === ownerId && a.cause.trim().toLowerCase() === key);
}

export function topAds(limit = LEADERBOARD_SIZE, today = false) {
  const live = db().ads.filter(isLive);
  const day = dayKey();
  return live
    .map((ad) => ({ ad, count: today ? (ad.viewsByDay[day] ?? 0) : ad.views }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface ClientRow {
  user: User;
  score: number;
  activeAds: number;
}

/** Weekly board of clients (companies). Ads may be gone, the credits stay. */
export function topClients(week = weekKey(), limit = LEADERBOARD_SIZE): ClientRow[] {
  const all = db();
  return all.users
    .filter((u) => u.role === "client" && !u.suspended && (u.scores[week] ?? 0) > 0)
    .map((user) => ({
      user,
      score: user.scores[week] ?? 0,
      activeAds: all.ads.filter((a) => a.ownerId === user.id && isLive(a)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
