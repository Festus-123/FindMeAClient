import "server-only";
import { FEED_LIMIT_SEEN } from "./config";
import { db, save } from "./db";
import { isLive } from "./service";
import type { Ad, User } from "./types";

export interface FeedOptions {
  q?: string;
  category?: string;
}

const norm = (s: string) => s.trim().toLowerCase();

/** SEO-style ranking: keywords a client sets rank the ad higher when searched. */
function relevance(ad: Ad, q: string, follows: string[]): number {
  let score = 0;
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    for (const t of terms) {
      if (ad.keywords.some((k) => k === t)) score += 30; // exact keyword hit
      else if (ad.keywords.some((k) => k.includes(t))) score += 15;
      if (norm(ad.title).includes(t)) score += 10;
      if (norm(ad.category).includes(t)) score += 5;
      if (norm(ad.description).includes(t)) score += 2;
    }
  }
  if (follows.includes(ad.category)) score += 15;
  // Fresher ads (more time left) edge ahead so nobody sees a stale ad.
  const left = Math.max(0, ad.expiresAt - Date.now());
  score += Math.min(10, left / 3600_000 / 10);
  return score;
}

/**
 * Feed rules:
 *  - every live ad must appear on every signed-in user's feed at least once, so ads the user has
 *    not been delivered yet are always included and sorted first (never cut by the limit);
 *  - an ad may appear again later, but only a limited number of already-delivered ads are shown;
 *  - delivery is not a view: the view counter only moves when the user opens the ad.
 */
export function buildFeed(user: User | null, opts: FeedOptions = {}) {
  const q = norm(opts.q ?? "");
  const follows = user?.follows ?? [];
  let ads = db().ads.filter(isLive);
  if (opts.category) ads = ads.filter((a) => a.category === opts.category);
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    ads = ads.filter((a) => {
      const hay = `${a.title} ${a.category} ${a.description} ${a.keywords.join(" ")}`.toLowerCase();
      return terms.some((t) => hay.includes(t));
    });
  }

  const ranked = ads
    .map((ad) => ({ ad, score: relevance(ad, q, follows) }))
    .sort((a, b) => b.score - a.score || b.ad.startsAt - a.ad.startsAt);

  if (!user) return { ads: ranked.slice(0, FEED_LIMIT_SEEN).map((r) => r.ad), freshIds: new Set<string>() };

  const fresh = ranked.filter((r) => !r.ad.deliveredTo.includes(user.id));
  const seen = ranked.filter((r) => r.ad.deliveredTo.includes(user.id)).slice(0, FEED_LIMIT_SEEN);
  const shown = [...fresh, ...seen].map((r) => r.ad);

  // Record delivery for the ads that were actually rendered.
  let changed = false;
  for (const r of fresh) {
    r.ad.deliveredTo.push(user.id);
    changed = true;
  }
  if (changed) save();
  return { ads: shown, freshIds: new Set(fresh.map((r) => r.ad.id)) };
}
