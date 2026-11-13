"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCan } from "@/lib/auth";
import { AD_HOURS, CATEGORIES } from "@/lib/config";
import { db, save, uid, UPLOAD_DIR } from "@/lib/db";
import { createPayment } from "@/lib/payments";
import { quoteAd, restorePrice } from "@/lib/pricing";
import { activateAd, adsInCause, findAd } from "@/lib/service";
import type { Ad, AdDetail, ApplyMethod } from "@/lib/types";
import type { FormState } from "./auth";

const MAX_IMAGE = 2 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function text(fd: FormData, key: string, max: number) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

export async function createAd(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireCan("ad.create");

  const title = text(fd, "title", 100);
  const description = text(fd, "description", 2000);
  const category = text(fd, "category", 60);
  const cause = text(fd, "cause", 80) || title;
  const hours = Number(fd.get("hours"));
  const adoptable = fd.get("adoptable") === "on";

  if (title.length < 4) return { error: "Give the ad a title of at least 4 characters." };
  if (description.length < 20) return { error: "Describe the role in at least 20 characters." };
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Pick a category." };
  if (!(AD_HOURS as readonly number[]).includes(hours)) return { error: "Pick how long the ad should stay up." };

  // Optional detail rows: the client only adds the ones they need.
  const labels = fd.getAll("detailLabel").map(String);
  const values = fd.getAll("detailValue").map(String);
  const details: AdDetail[] = [];
  labels.forEach((label, i) => {
    const l = label.trim().slice(0, 40);
    const v = (values[i] ?? "").trim().slice(0, 300);
    if (l && v && details.length < 12) details.push({ label: l, value: v });
  });

  const keywords = [
    ...new Set(
      text(fd, "keywords", 400)
        .toLowerCase()
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  ].slice(0, 10);

  // How people apply: inside the app, or via an email, phone number or link the client shares.
  const method = text(fd, "applyMethod", 10) || "inbox";
  if (!["inbox", "email", "phone", "link"].includes(method)) return { error: "Pick how people should apply." };
  const applyMethod = method as ApplyMethod;
  let applyValue = "";
  if (applyMethod !== "inbox") {
    applyValue = text(fd, "applyValue", 200);
    if (applyMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyValue)) return { error: "Enter a valid email for applications." };
    if (applyMethod === "phone" && applyValue.replace(/\D/g, "").length < 7) return { error: "Enter a valid phone or WhatsApp number." };
    if (applyMethod === "link" && !/^https?:\/\/\S+$/i.test(applyValue)) return { error: "Application link must start with http:// or https://." };
  }

  // Co-hosts must be existing client accounts. The owner alone pays.
  const emails = [
    ...new Set(
      text(fd, "cohosts", 400)
        .toLowerCase()
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    ),
  ];
  const cohostIds: string[] = [];
  for (const email of emails) {
    const host = db().users.find((u) => u.email === email);
    if (!host || host.role !== "client" || host.suspended) {
      return { error: `${email} is not a Find Me A Client client account.` };
    }
    if (host.id === user.id) return { error: "You are already the owner of this ad." };
    cohostIds.push(host.id);
  }

  const quote = quoteAd({
    priorAdsInCause: adsInCause(user.id, cause).length,
    freeAdAvailable: !user.freeAdUsed,
    cohostCount: cohostIds.length,
    hours,
  });
  if (!quote.ok) return { error: quote.error };

  // Optional image.
  let image: string | null = null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0 && fd.get("_mode") !== "url") {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { error: "Images must be PNG, JPG or WebP." };
    if (file.size > MAX_IMAGE) return { error: "Images must be under 2 MB." };
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    image = `${uid()}.${ext}`;
    fs.writeFileSync(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, image), Buffer.from(await file.arrayBuffer()));
  }

  // No upload? A pasted link to an image works too.
  if (!image) {
    const url = text(fd, "imageUrl", 500);
    if (url) {
      if (!/^https?:\/\/[^\s"'<>]+$/i.test(url)) return { error: "The image link must start with http:// or https://." };
      image = url;
    }
  }

  const now = Date.now();
  const ad: Ad = {
    id: uid(),
    ownerId: user.id,
    cohostIds,
    title,
    cause,
    category,
    description,
    details,
    keywords,
    image,
    applyMethod,
    applyValue,
    appliedBy: [],
    adoptable: adoptable && !!image && !/^https?:/.test(image),
    status: "pending_payment",
    hours,
    price: quote.total,
    createdAt: now,
    startsAt: 0,
    expiresAt: 0,
    purgeAt: 0,
    views: 0,
    viewsByDay: {},
    applies: 0,
    shares: 0,
    viewedBy: [],
    deliveredTo: [],
  };
  db().ads.push(ad);
  save();

  if (quote.total === 0) {
    activateAd(ad);
    revalidatePath("/", "layout");
    redirect(`/dashboard/ads/${ad.id}`);
  }
  const payment = createPayment({ userId: user.id, kind: "ad", amount: quote.total, adId: ad.id });
  redirect(`/pay/${payment.ref}`);
}

/** Start restoring an expired ad. Restoring costs 40% of the ad's price. */
export async function restoreAd(fd: FormData) {
  const user = await requireCan("ad.manage");
  const ad = findAd(String(fd.get("adId")));
  if (!ad || ad.ownerId !== user.id) throw new Error("Ad not found.");
  if (ad.status !== "expired") throw new Error("Only expired ads can be restored.");
  const payment = createPayment({
    userId: user.id,
    kind: "restore",
    amount: restorePrice(ad.price),
    adId: ad.id,
  });
  redirect(`/pay/${payment.ref}`);
}

/** Owner confirms they don't want an expired ad back. */
export async function deleteAd(fd: FormData) {
  const user = await requireCan("ad.manage");
  const ad = findAd(String(fd.get("adId")));
  if (!ad || ad.ownerId !== user.id) throw new Error("Ad not found.");
  if (ad.status === "live") throw new Error("A live ad can't be deleted before it ends.");
  const store = db();
  store.ads = store.ads.filter((a) => a.id !== ad.id);
  store.threads = store.threads.filter((t) => t.adId !== ad.id);
  if (ad.image && !/^https?:/.test(ad.image)) fs.rmSync(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, ad.image), { force: true });
  save();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
