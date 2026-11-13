"use server";

import { redirect } from "next/navigation";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createSession, destroySession } from "@/lib/auth";
import { db, hashPassword, save, syncDb, uid } from "@/lib/db";

export interface FormState {
  error?: string;
  ok?: boolean;
  message?: string;
}

/** Only allow same-site relative paths so ?next= cannot become an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  await syncDb();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (name.length < 2 || name.length > 80) return { error: "Enter your name (2–80 characters)." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (role !== "client" && role !== "employee") return { error: "Choose how you'll use Find Me A Client." };

  const store = db();
  if (store.users.some((u) => u.email === email)) {
    return { error: "An account with this email already exists. Try signing in." };
  }
  const salt = randomBytes(16).toString("hex");
  const id = uid();
  store.users.push({
    id,
    name,
    email,
    role,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: Date.now(),
    suspended: false,
    follows: [],
    subscribedUntil: 0,
    freeAdUsed: false,
    scores: {},
  });
  save();
  await createSession(id);
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  await syncDb();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = db().users.find((u) => u.email === email);

  // Same message for unknown email and wrong password so accounts can't be probed.
  const generic = { error: "Email or password is incorrect." };
  if (!user) return generic;
  const a = Buffer.from(hashPassword(password, user.salt), "hex");
  const b = Buffer.from(user.passwordHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return generic;
  if (user.suspended) return { error: "This account has been suspended." };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
