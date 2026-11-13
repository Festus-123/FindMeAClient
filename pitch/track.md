# Build tracker

What was built from the pitch, what changed in the repo, and what is still open.
Last updated: 2026-11-13.

## Decisions you gave (applied)

| # | Your answer | How it is implemented |
|---|---|---|
| 1 | Ads for one cause cost 1,000 → 2,000 → 4,000 → 8,000 | `lib/pricing.ts` `quoteAd()`: `1000 × 2^(ads already in cause)`. First ad ever is free. |
| 2 | Leaderboard keeps credits after the ad is gone; store counts, not events | Credits are a number per client per ISO week on the user record (`user.scores["2026-W46"]`). Ads only hold counters (`views`, `applies`, `shares`). Deleting or purging an ad never touches credits. |
| 3 | Every ad must reach every user **at least once** (may repeat, delivery ≠ view) | `lib/feed.ts`: ads a user has not been delivered yet are always included and sorted first, and are never cut by the list limit. Only already-seen ads are capped (30). A **view** is counted only when the ad page is opened. |
| 4 | Permissions clear by role and activity | `lib/permissions.ts`: one matrix (`guest`, `employee`, `client`, `admin`) + ownership helpers. Enforced inside every Server Action and page, not just in the UI. A summary is shown on the sign-up form. |
| 5 | Co-hosts raise the charge; one account pays | Owner adds up to 2 co-host emails (must be existing client accounts). Co-hosts can see stats, reply to applicants and earn credits. Only the owner can pay, restore or delete. |
| 6 | Extended runtime surcharge | Config-driven, see "Assumptions" below. |
| 7 | Read the Next.js docs first, keep this file | Read `node_modules/next/dist/docs/` (proxy, async `cookies()`/`params`, `unstable_retry`, Server Actions). Uses `proxy.ts`, not middleware. |

## Pricing (all numbers in `lib/config.ts`)

| Item | Price |
|---|---|
| First ad, ever | Free |
| Ad for a cause (1st / 2nd / 3rd / 4th) | ₦1,000 / 2,000 / 4,000 / 8,000. A 5th is blocked |
| Co-host | +₦500 each (max 2) |
| Runtime 24h / 48h / 72h / 96h | +0% / 6% / 12% / 18% of the ad cost |
| Restore an expired ad | 40% of the price paid (floor ₦400 so free ads are not restored free) |
| Subscription | ₦1,000 / month, grants the Pro badge |

## Assumptions I made. Please confirm or correct

1. **Extension surcharge.** Your note read "6 % … 65 is charged from the total amount paid". I read it as **6% of the ad's cost per extra 24h** past the first day. If you meant a flat 65% or something else, change `extensionRatePerExtraDay` in `lib/config.ts`.
2. **Co-host fee ₦500 each.** The pitch said "the charge increases" but gave no figure.
3. **"Max 4 ads"** is applied **per cause per client**, not 4 ads total.
4. **"Cause"** is a free-text field on the ad form (defaults to the title). Same text (case-insensitive) = same cause.
5. **Restore** brings the ad back for its original runtime and re-delivers it to everyone.
6. **Runtime is chosen at creation only.** Extending a live ad later is not built.
7. **Pro badge** is shown next to names. The ₦3,000 tier (AI search, reveal) is **not built**; "3,00" was read as ₦3,000.
8. **Guests** are not tracked in the feed guarantee (no identity). They get a ranked feed; the guarantee applies to signed-in users.

## What exists

**Public (no sign-in):** feed at `/` (no landing page), search + category filter, ad page, leaderboard, trending today. Any action (apply, follow, share, download) opens a "join to continue" prompt.

**Employee:** apply to ads, message clients, follow categories, notifications, share, download adoptable images, subscribe.

**Client:** post ads (title, category, cause, optional detail rows + custom ones, SEO keywords, image, adoptable, co-hosts, runtime) with a live price preview; dashboard with views / applications / shares / weekly credits; manage page; "ended: keep or let go?" prompt with restore (pays 40%) or delete; unread inbox.

**Admin:** all ads and users, remove ads, suspend / restore accounts, revenue total. Created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

**Rules:** ads expire after the chosen hours, stay restorable for 5 days (`GRACE_MS`), then are purged. Unpaid ads are dropped after 24h. Replies close when an ad ends.

**Leaderboards:** top 5 most-viewed today, top 5 most-viewed live ads, top 5 clients this week (view = 1, apply = 5, share = 3).

**Theme (`pitch/theme.txt`):** Montserrat; bright blue / red / green on white; no shadows, no gradients, no hard borders (flat tinted surfaces); custom dropdown (`Select`) and error / success messages; `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`; 200ms fade only; smooth scroll; `prefers-reduced-motion` respected.

## Files changed

**Added**
- `lib/` `types.ts`, `config.ts`, `pricing.ts`, `permissions.ts`, `db.ts`, `auth.ts`, `payments.ts`, `service.ts`, `feed.ts`, `format.ts`
- `app/actions/` `auth.ts`, `ads.ts`, `engage.ts`, `pay.ts`, `admin.ts`
- `app/_components/` `Header`, `ui` (Badge, ErrorMessage, Select, Gate, SubmitButton), `AdCard`, `AdActions`, `AdForm`, `AuthForm`, `ThreadReply`
- `app/` `ads/[id]`, `dashboard`, `dashboard/new`, `dashboard/ads/[id]`, `inbox`, `leaderboard`, `login`, `register`, `pay/[ref]`, `admin`, `uploads/[name]` (route), `loading`, `error`, `global-error`, `not-found`
- `proxy.ts` (optimistic redirect for private pages), `.env.example`

**Replaced**
- `app/page.tsx` (was the PiperX landing page, now the feed), `app/layout.tsx` (Montserrat + header), `app/globals.css` (new flat theme)

**Edited**
- `.gitignore`: added `/data`

**Left untouched, now unused:** `app/components/{Hero,About,Mediums,Contact}.tsx` (from the earlier PiperX page). Safe to delete.

## Verified

- Pricing rules: 12 assertions pass (free first ad, 1k/2k/4k/8k, 5th blocked, +6% / +18%, co-hosts, restore 40% and floor).
- Feed: 50 live ads with a 30-ad cap still deliver all 50 to a new user; new ads land on top for returning users; each user gets every ad once; keyword match ranks first; follower notifications; credits survive deleting all ads.
- `next build` and `tsc` pass. Private routes redirect guests to `/login?next=…`. Unknown pages 404. Upload route rejects path traversal.

## Not yet tested / open

- **Server Action flows were not exercised in a browser** (sign-up, create ad, pay, apply, reply). They typecheck and build, but click through them once before relying on them.
- **Payments are a test-mode simulator.** The "Pay" button only works outside production. Connect Flutterwave / Monnify behind `lib/payments.ts` (checkout + signed webhook calling `markPaid`) before launch.
- **Storage is a JSON file** (`data/db.json`) and uploads live in `data/uploads/`. Fine for local and a single server. Move to Postgres + object storage before real traffic or serverless hosting. Only `lib/db.ts` needs to change.
- No password reset, email verification or rate limiting yet.
- AI search / reveal tier, extending a live ad, and notification emails are not built.
