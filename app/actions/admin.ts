"use server";

import { revalidatePath } from "next/cache";
import { requireCan } from "@/lib/auth";
import { db, save } from "@/lib/db";
import { notify } from "@/lib/service";

export async function removeAd(fd: FormData) {
  await requireCan("admin.moderate");
  const id = String(fd.get("adId"));
  const store = db();
  const ad = store.ads.find((a) => a.id === id);
  if (!ad) return;
  notify(ad.ownerId, `Your ad "${ad.title}" was removed by a moderator.`, "/dashboard");
  store.ads = store.ads.filter((a) => a.id !== id);
  store.threads = store.threads.filter((t) => t.adId !== id);
  save();
  revalidatePath("/", "layout");
}

export async function toggleSuspend(fd: FormData) {
  const admin = await requireCan("admin.moderate");
  const target = db().users.find((u) => u.id === String(fd.get("userId")));
  if (!target || target.role === "admin" || target.id === admin.id) return;
  target.suspended = !target.suspended;
  save();
  revalidatePath("/admin");
}
