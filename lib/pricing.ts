import { AD_HOURS, PRICING } from "./config";

export interface QuoteInput {
  /** Non-purged ads this client already has for the same cause. */
  priorAdsInCause: number;
  /** True when the client has never used their free ad. */
  freeAdAvailable: boolean;
  cohostCount: number;
  hours: number;
}

export interface Quote {
  ok: boolean;
  error?: string;
  /** Exponential cost for this ad before extras (0 when the ad is free). */
  base: number;
  cohostFee: number;
  extensionFee: number;
  total: number;
}

const round = (n: number) => Math.round(n);

/** Pure, shared by the form preview and the server so both always agree. */
export function quoteAd(input: QuoteInput): Quote {
  const empty = { base: 0, cohostFee: 0, extensionFee: 0, total: 0 };
  if (!(AD_HOURS as readonly number[]).includes(input.hours)) {
    return { ok: false, error: "Pick a valid duration.", ...empty };
  }
  if (input.cohostCount < 0 || input.cohostCount > PRICING.maxCohosts) {
    return { ok: false, error: `An ad can have at most ${PRICING.maxCohosts} co-hosts.`, ...empty };
  }
  if (input.priorAdsInCause >= PRICING.maxAdsPerCause) {
    return {
      ok: false,
      error: `You can run at most ${PRICING.maxAdsPerCause} ads for one cause.`,
      ...empty,
    };
  }
  // Ad n of a cause costs base * 2^(n-1): 1,000 → 2,000 → 4,000 → 8,000.
  const exponential = PRICING.baseAd * 2 ** input.priorAdsInCause;
  const base = input.freeAdAvailable ? 0 : exponential;
  const cohostFee = input.cohostCount * PRICING.perCohost;
  const subtotal = base + cohostFee;
  const extraDays = input.hours / 24 - 1;
  const extensionFee = round(subtotal * PRICING.extensionRatePerExtraDay * extraDays);
  return { ok: true, base, cohostFee, extensionFee, total: subtotal + extensionFee };
}

/**
 * Restoring costs 40% of what the ad cost. A free ad would restore for 0, so the
 * floor is 40% of the standard base price (ASSUMPTION).
 */
export function restorePrice(pricePaid: number): number {
  const floor = PRICING.baseAd * PRICING.restoreRate;
  return round(Math.max(pricePaid * PRICING.restoreRate, floor));
}

export const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
