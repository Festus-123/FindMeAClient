import "server-only";
import { randomBytes } from "node:crypto";
import { db, save, uid } from "./db";
import type { Payment, PaymentKind } from "./types";

/**
 * Provider boundary. The rest of the app only knows "create a pending payment, then confirm it".
 * To go live, implement `PaymentProvider` for Flutterwave/Monnify/etc. (checkout URL + webhook
 * that calls `markPaid`) and select it below. Until then the test provider confirms on a button.
 */
export interface PaymentProvider {
  name: string;
  /** True only for the built-in simulator, which must never run in production. */
  simulated: boolean;
}

export const provider: PaymentProvider = { name: "Test mode", simulated: true };

export function createPayment(input: {
  userId: string;
  kind: PaymentKind;
  amount: number;
  adId?: string;
}): Payment {
  const p: Payment = {
    id: uid(),
    ref: `fmc_${randomBytes(8).toString("hex")}`,
    userId: input.userId,
    kind: input.kind,
    amount: input.amount,
    status: "pending",
    adId: input.adId,
    createdAt: Date.now(),
  };
  db().payments.push(p);
  save();
  return p;
}

export const findPayment = (ref: string) => db().payments.find((p) => p.ref === ref);

/** Idempotent: webhooks retry, so a second call is a no-op returning false. */
export function markPaid(ref: string): Payment | null {
  const p = findPayment(ref);
  if (!p || p.status === "paid") return null;
  p.status = "paid";
  p.paidAt = Date.now();
  save();
  return p;
}
