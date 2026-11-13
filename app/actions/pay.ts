"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCan, requireUser } from "@/lib/auth";
import { PRICING, SUBSCRIPTION_DAYS } from "@/lib/config";
import { findPayment, markPaid, provider, createPayment } from "@/lib/payments";
import { activateAd, findAd } from "@/lib/service";
import { save } from "@/lib/db";

/** Starts a subscription checkout. Works for clients and employees. */
export async function startSubscription() {
  const user = await requireCan("subscription.buy");
  const payment = createPayment({
    userId: user.id,
    kind: "subscription",
    amount: PRICING.subscriptionMonthly,
  });
  redirect(`/pay/${payment.ref}`);
}

/**
 * Confirms a payment in test mode. A real provider would instead call `markPaid` from a
 * signed webhook; the fulfilment below is what both paths share.
 */
export async function confirmTestPayment(fd: FormData) {
  if (!provider.simulated || process.env.NODE_ENV === "production") {
    throw new Error("Test payments are disabled.");
  }
  const user = await requireUser();
  const ref = String(fd.get("ref"));
  const payment = findPayment(ref);
  if (!payment || payment.userId !== user.id) throw new Error("Payment not found.");

  if (markPaid(ref)) {
    if (payment.kind === "ad" || payment.kind === "restore") {
      const ad = findAd(payment.adId ?? "");
      if (ad) activateAd(ad);
    } else if (payment.kind === "subscription") {
      user.subscribedUntil = Math.max(Date.now(), user.subscribedUntil) + SUBSCRIPTION_DAYS * 86_400_000;
      save();
    }
  }
  revalidatePath("/", "layout");
  redirect(payment.adId ? `/dashboard/ads/${payment.adId}` : "/dashboard");
}
