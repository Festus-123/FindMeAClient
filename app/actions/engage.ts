"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser, requireCan, viewerId } from "@/lib/auth";
import { CATEGORIES } from "@/lib/config";
import { dayKey, db, save, uid } from "@/lib/db";
import { can, isHost } from "@/lib/permissions";
import { credit, findAd, hostsOf, isLive, notify } from "@/lib/service";
import type { FormState } from "./auth";

/** Counts one view per viewer per ad, only when the viewer is not one of the hosts. */
export async function recordView(adId: string) {
  const ad = findAd(adId);
  if (!ad || !isLive(ad)) return;
  const user = await getUser();
  if (isHost(user, ad)) return;
  const id = await viewerId();
  if (ad.viewedBy.includes(id)) return;
  ad.viewedBy.push(id);
  ad.views += 1;
  const day = dayKey();
  ad.viewsByDay[day] = (ad.viewsByDay[day] ?? 0) + 1;
  // Keep only today's bucket plus yesterday's; older days are never read.
  for (const k of Object.keys(ad.viewsByDay)) if (k < day && ad.viewsByDay[k] !== undefined) delete ad.viewsByDay[k];
  credit(ad, "view");
  save();
}

export async function recordShare(adId: string) {
  const user = await getUser();
  if (!can(user, "ad.share")) return;
  const ad = findAd(adId);
  if (!ad || !isLive(ad) || isHost(user, ad)) return;
  ad.shares += 1;
  credit(ad, "share");
  save();
}

export async function applyToAd(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireCan("ad.apply");
  const ad = findAd(String(fd.get("adId")));
  if (!ad || !isLive(ad)) return { error: "This ad is no longer open." };
  if (isHost(user, ad)) return { error: "You can't apply to your own ad." };
  const message = String(fd.get("message") ?? "").trim().slice(0, 1500);
  if (message.length < 10) return { error: "Write at least a short note (10+ characters)." };

  const store = db();
  if (store.threads.some((t) => t.adId === ad.id && t.applicantId === user.id)) {
    return { error: "You already applied to this ad. Check your inbox for replies." };
  }
  const hostIds = hostsOf(ad);
  store.threads.push({
    id: uid(),
    adId: ad.id,
    adTitle: ad.title,
    applicantId: user.id,
    hostIds,
    messages: [{ from: user.id, text: message, at: Date.now() }],
    unreadFor: hostIds,
    updatedAt: Date.now(),
  });
  ad.applies += 1;
  credit(ad, "apply");
  for (const h of hostIds) notify(h, `${user.name} applied to "${ad.title}"`, `/inbox`);
  save();
  revalidatePath("/inbox");
  return { ok: true, message: "Application sent. You'll see replies in your inbox." };
}

/** Counts a click on an ad's external contact (email, phone or link) once per user. */
export async function recordExternalApply(adId: string) {
  const user = await getUser();
  if (!user || !can(user, "ad.apply")) return;
  const ad = findAd(adId);
  if (!ad || !isLive(ad) || isHost(user, ad)) return;
  ad.appliedBy ??= [];
  if (ad.appliedBy.includes(user.id)) return;
  ad.appliedBy.push(user.id);
  ad.applies += 1;
  credit(ad, "apply");
  for (const h of hostsOf(ad)) notify(h, `${user.name} reached out about "${ad.title}"`, `/dashboard/ads/${ad.id}`);
  save();
}

/** A worker account becomes a client so it can post ads. Nothing is lost: clients can still apply to other ads. */
export async function becomeClient() {
  const user = await requireCan("ad.apply");
  if (user.role === "employee") {
    user.role = "client";
    save();
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/new");
}

export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireCan("inbox.use");
  const thread = db().threads.find((t) => t.id === String(fd.get("threadId")));
  if (!thread) return { error: "Conversation not found." };
  const participant = thread.applicantId === user.id || thread.hostIds.includes(user.id);
  if (!participant) return { error: "You are not part of this conversation." };
  const ad = findAd(thread.adId);
  if (!ad || !isLive(ad)) return { error: "This ad has expired, so replies are closed." };
  const textValue = String(fd.get("text") ?? "").trim().slice(0, 1500);
  if (!textValue) return { error: "Write a message first." };

  thread.messages.push({ from: user.id, text: textValue, at: Date.now() });
  thread.updatedAt = Date.now();
  const others = [thread.applicantId, ...thread.hostIds].filter((id) => id !== user.id);
  thread.unreadFor = [...new Set(others)];
  for (const id of thread.unreadFor) notify(id, `New message about "${thread.adTitle}"`, "/inbox");
  save();
  revalidatePath("/inbox");
  return { ok: true };
}

export async function toggleFollow(fd: FormData) {
  const user = await requireCan("ad.follow");
  const category = String(fd.get("category"));
  if (!(CATEGORIES as readonly string[]).includes(category)) return;
  user.follows = user.follows.includes(category)
    ? user.follows.filter((c) => c !== category)
    : [...user.follows, category];
  save();
  revalidatePath("/", "layout");
}

export async function markAllRead() {
  const user = await requireCan("inbox.use");
  for (const n of db().notifications) if (n.userId === user.id) n.read = true;
  save();
  revalidatePath("/", "layout");
}

export async function markThreadRead(threadId: string) {
  const user = await requireCan("inbox.use");
  const thread = db().threads.find((t) => t.id === threadId);
  if (!thread) return;
  thread.unreadFor = thread.unreadFor.filter((id) => id !== user.id);
  save();
  revalidatePath("/", "layout");
}
