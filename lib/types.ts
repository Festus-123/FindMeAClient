export type Role = "client" | "employee" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  salt: string;
  passwordHash: string;
  createdAt: number;
  suspended: boolean;
  /** Categories this user follows (employees get notified on new ads). */
  follows: string[];
  /** Subscription end (ms). Active while > now; grants the badge. */
  subscribedUntil: number;
  /** Clients: the first ad ever is free; flipped once it is used. */
  freeAdUsed: boolean;
  /** Clients: weekly engagement credits, e.g. { "2026-W46": 120 }. Counts only, never events. */
  scores: Record<string, number>;
}

export type AdStatus = "pending_payment" | "live" | "expired";

export interface AdDetail {
  label: string;
  value: string;
}

export type ApplyMethod = "inbox" | "email" | "phone" | "link";

export interface Ad {
  id: string;
  ownerId: string;
  /** Extra hosts (max 2). Only the owner pays, hosts can see stats and reply. */
  cohostIds: string[];
  title: string;
  /** Ads for the same cause by the same client are charged exponentially. */
  cause: string;
  category: string;
  description: string;
  details: AdDetail[];
  keywords: string[];
  /** Uploaded file name, or a full http(s) URL to an image. */
  image: string | null;
  /** How people should apply. Missing on older ads, which behave like "inbox". */
  applyMethod?: ApplyMethod;
  /** Email, phone number or link for the non-inbox methods. */
  applyValue?: string;
  /** Users who already used the external contact (counted once each). */
  appliedBy?: string[];
  adoptable: boolean;
  status: AdStatus;
  /** Chosen runtime: 24, 48, 72 or 96. */
  hours: number;
  /** Total naira paid for the current run (used for the restore price). */
  price: number;
  createdAt: number;
  /** Set when the ad goes live. */
  startsAt: number;
  expiresAt: number;
  /** Expired ads are kept until this time, then purged. */
  purgeAt: number;
  // Counters only. Engagement is summed, never stored as events.
  views: number;
  /** Views counted on the current day (key: yyyy-mm-dd). */
  viewsByDay: Record<string, number>;
  applies: number;
  shares: number;
  /** User or guest ids that already counted as a view (for de-duplication). */
  viewedBy: string[];
  /** User ids the feed has already delivered this ad to at least once. */
  deliveredTo: string[];
}

export interface ThreadMessage {
  from: string;
  text: string;
  at: number;
}

export interface Thread {
  id: string;
  adId: string;
  adTitle: string;
  applicantId: string;
  /** Owner + cohosts at the time of applying. */
  hostIds: string[];
  messages: ThreadMessage[];
  /** User ids that have not read the latest message. */
  unreadFor: string[];
  updatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  href: string;
  read: boolean;
  at: number;
}

export type PaymentKind = "ad" | "restore" | "subscription";

export interface Payment {
  id: string;
  ref: string;
  userId: string;
  kind: PaymentKind;
  amount: number;
  status: "pending" | "paid";
  adId?: string;
  createdAt: number;
  paidAt?: number;
}

export interface DB {
  users: User[];
  ads: Ad[];
  threads: Thread[];
  notifications: Notification[];
  payments: Payment[];
}
