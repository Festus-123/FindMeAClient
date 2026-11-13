import type { Ad, Role, User } from "./types";

export type Action =
  | "feed.view"
  | "ad.view"
  | "leaderboard.view"
  | "ad.share"
  | "ad.apply"
  | "ad.follow"
  | "ad.download"
  | "inbox.use"
  | "ad.create"
  | "ad.manage"
  | "subscription.buy"
  | "admin.panel"
  | "admin.moderate";

/** Guests can browse; anything else prompts them to register. */
const MATRIX: Record<Role | "guest", ReadonlySet<Action>> = {
  guest: new Set(["feed.view", "ad.view", "leaderboard.view"]),
  employee: new Set([
    "feed.view",
    "ad.view",
    "leaderboard.view",
    "ad.share",
    "ad.apply",
    "ad.follow",
    "ad.download",
    "inbox.use",
    "subscription.buy",
  ]),
  client: new Set([
    "feed.view",
    "ad.view",
    "leaderboard.view",
    "ad.share",
    "ad.apply",
    "ad.follow",
    "ad.download",
    "inbox.use",
    "ad.create",
    "ad.manage",
    "subscription.buy",
  ]),
  admin: new Set([
    "feed.view",
    "ad.view",
    "leaderboard.view",
    "ad.share",
    "inbox.use",
    "admin.panel",
    "admin.moderate",
  ]),
};

export function can(user: Pick<User, "role"> | null, action: Action): boolean {
  return MATRIX[user ? user.role : "guest"].has(action);
}

export const isOwner = (user: User | null, ad: Ad) => !!user && ad.ownerId === user.id;
export const isHost = (user: User | null, ad: Ad) =>
  !!user && (ad.ownerId === user.id || ad.cohostIds.includes(user.id));

/** Hosts see stats and reply to applicants; only the owner pays, restores or deletes. */
export const canSeeAdStats = (user: User | null, ad: Ad) =>
  !!user && (user.role === "admin" || isHost(user, ad));
export const canPayOrDelete = (user: User | null, ad: Ad) => isOwner(user, ad);

/** Human readable summary for the permissions section of the UI. */
export const ROLE_SUMMARY: Record<Role, string[]> = {
  employee: [
    "Browse the feed and leaderboards",
    "Apply to ads and message clients",
    "Follow categories and get notified",
    "Share ads and download adoptable images",
    "Subscribe for a badge",
  ],
  client: [
    "Everything a visitor can do, plus following and sharing",
    "Apply to other clients' ads, like a worker (never your own)",
    "Create ads, pick keywords and a runtime",
    "Invite up to 2 co-hosts (you pay)",
    "See views, applies and shares for your ads",
    "Restore or delete expired ads",
    "Appear on the weekly client leaderboard",
  ],
  admin: [
    "View all ads, users and payments",
    "Remove ads that break the rules",
    "Suspend or restore accounts",
    "Cannot create ads or apply",
  ],
};
