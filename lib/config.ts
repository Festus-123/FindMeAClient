/**
 * Every business number lives here so pricing can be tuned without touching logic.
 * Amounts are in naira.
 */
export const PRICING = {
  /** Price of the first ad for a cause. Each further ad for the same cause doubles. */
  baseAd: 1_000,
  /** Max ads a client can run for a single cause. */
  maxAdsPerCause: 4,
  /** Extra charge per additional host on an ad (ASSUMPTION: not specified in the pitch). */
  perCohost: 500,
  /** Max additional hosts (an ad can be hosted by 2 or 3 people in total). */
  maxCohosts: 2,
  /** Surcharge per extra 24h block beyond the first, as a share of the ad cost (ASSUMPTION: "6%"). */
  extensionRatePerExtraDay: 0.06,
  /** Restoring an expired ad costs this share of what the ad cost. */
  restoreRate: 0.4,
  /** Monthly subscription (client or employee) that unlocks the badge. */
  subscriptionMonthly: 1_000,
} as const;

export const AD_HOURS = [24, 48, 72, 96] as const;
export const SUBSCRIPTION_DAYS = 30;

/** Expired ads stay restorable for this long. */
export const GRACE_MS = 5 * 24 * 60 * 60 * 1000;

/** Engagement credit weights for the client leaderboard. */
export const SCORE_WEIGHTS = {
  view: 1,
  apply: 5,
  share: 3,
} as const;

export const FEED_LIMIT_SEEN = 30;
export const LEADERBOARD_SIZE = 5;

export const CATEGORIES = [
  "Web & Software",
  "Design & Creative",
  "Photography & Video",
  "Farming & Agriculture",
  "Writing & Translation",
  "Trades & Construction",
  "Tutoring & Education",
  "Delivery & Logistics",
  "Beauty & Fashion",
  "Events & Hospitality",
  "Other",
] as const;

/** Optional detail fields a client can switch on. They can also add custom ones. */
export const DETAIL_PRESETS = [
  "Location",
  "Pay / Budget",
  "Job type",
  "Experience needed",
  "Deadline",
  "People needed",
  "Requirements",
  "How to reach me",
] as const;

export const SESSION_COOKIE = "fmc_session";
export const GUEST_COOKIE = "fmc_guest";
