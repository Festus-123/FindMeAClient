import Link from "next/link";
import Icon, { CATEGORY_ICONS, type IconName } from "../_components/Icon";
import PostAdButton from "../_components/PostAdButton";
import { Badge } from "../_components/ui";
import { toggleFollow } from "../actions/engage";
import { startSubscription } from "../actions/pay";
import { requireUser, hasBadge } from "@/lib/auth";
import { CATEGORIES, PRICING } from "@/lib/config";
import { db, weekKey } from "@/lib/db";
import { ago, timeLeft } from "@/lib/format";
import { naira, restorePrice } from "@/lib/pricing";
import type { Ad } from "@/lib/types";

export default async function DashboardPage() {
  const user = await requireUser(["client", "employee"], "/dashboard");
  const week = weekKey();
  const client = user.role === "client";
  const initial = (user.name.trim()[0] ?? "?").toUpperCase();
  const tone = ["bg-red", "bg-blue", "bg-green"][initial.charCodeAt(0) % 3];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-4 bg-surface p-5">
        {/* The first letter of the name stands in for a logo. */}
        <span aria-hidden className={`flex h-16 w-16 shrink-0 items-center justify-center text-3xl font-extrabold text-white ${tone}`}>
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <span className="truncate">{user.name}</span> {hasBadge(user) && <Badge />}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name={client ? "users" : "briefcase"} size={14} /> {client ? "Finding workers" : "Finding clients"}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="mail" size={14} /> {user.email}
            </span>
          </p>
        </div>
        <PostAdButton role={user.role} label={`Post an ad${client && !user.freeAdUsed ? " · first one free" : ""}`} />
      </header>

      {!hasBadge(user) && (
        <form action={startSubscription} className="flex flex-wrap items-center gap-4 bg-green-soft p-5">
          <Icon name="medal" size={28} className="text-green" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">Get your Pro badge</p>
            <p className="text-sm text-muted">{naira(PRICING.subscriptionMonthly)} a month. Stand out next to your name.</p>
          </div>
          <button className="btn btn-green">Subscribe</button>
        </form>
      )}

      {client ? (
        <ClientView userId={user.id} week={week} score={user.scores[week] ?? 0} />
      ) : (
        <EmployeeView userId={user.id} follows={user.follows} />
      )}
    </div>
  );
}

function ClientView({ userId, week, score }: { userId: string; week: string; score: number }) {
  const ads = db()
    .ads.filter((a) => a.ownerId === userId || a.cohostIds.includes(userId))
    .sort((a, b) => b.createdAt - a.createdAt);
  const live = ads.filter((a) => a.status === "live");
  const pending = ads.filter((a) => a.status === "pending_payment");
  const expired = ads.filter((a) => a.status === "expired");
  const totals = ads.reduce(
    (t, a) => ({ views: t.views + a.views, applies: t.applies + a.applies, shares: t.shares + a.shares }),
    { views: 0, applies: 0, shares: 0 },
  );

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="eye" label="Views" value={totals.views} />
        <Stat icon="send" label="Applications" value={totals.applies} />
        <Stat icon="share" label="Shares" value={totals.shares} />
        <Stat icon="trophy" label={`Credits ${week}`} value={score} tone="green" />
      </section>

      {expired.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-red">
            <Icon name="clock" size={18} /> Ended: keep or let go?
          </h2>
          {expired.map((ad) => (
            <ExpiredRow key={ad.id} ad={ad} owner={ad.ownerId === userId} />
          ))}
        </section>
      )}

      <AdList title="Live" icon="flame" ads={live} empty="No live ads. Post one to start getting responses." />
      {pending.length > 0 && <AdList title="Waiting for payment" icon="clock" ads={pending} empty="" />}

      {/* Clients can also apply to other people's ads. */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="send" size={18} /> Ads you applied to
        </h2>
        <Applications userId={userId} />
      </section>
    </>
  );
}

function ExpiredRow({ ad, owner }: { ad: Ad; owner: boolean }) {
  const daysLeft = Math.max(0, Math.ceil((ad.purgeAt - Date.now()) / 86_400_000));
  return (
    <Link href={`/dashboard/ads/${ad.id}`} className="card flex flex-wrap items-center gap-3 bg-red-soft hover:opacity-90">
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold">{ad.title}</p>
        <p className="text-xs font-semibold text-muted">
          {ad.views} views · {ad.applies} applications · deleted in {daysLeft} day{daysLeft === 1 ? "" : "s"} · ended {ago(ad.expiresAt)}
        </p>
      </div>
      <span className="text-sm font-bold text-red">{owner ? `Restore for ${naira(restorePrice(ad.price))}` : "View"}</span>
    </Link>
  );
}

function AdList({ title, icon, ads, empty }: { title: string; icon: IconName; ads: Ad[]; empty: string }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name={icon} size={18} /> {title}
      </h2>
      {ads.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        ads.map((ad) => (
          <Link key={ad.id} href={`/dashboard/ads/${ad.id}`} className="card flex flex-wrap items-center gap-3 hover:bg-red-soft">
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">{ad.title}</p>
              <p className="text-xs font-semibold text-muted">
                {ad.status === "live" ? timeLeft(ad.expiresAt) : "Not live yet"} · {ad.category}
              </p>
            </div>
            <div className="flex gap-5 text-sm font-extrabold">
              <span className="flex items-center gap-1.5" title="Views"><Icon name="eye" size={14} className="text-muted" />{ad.views}</span>
              <span className="flex items-center gap-1.5" title="Applications"><Icon name="send" size={14} className="text-muted" />{ad.applies}</span>
              <span className="flex items-center gap-1.5" title="Shares"><Icon name="share" size={14} className="text-muted" />{ad.shares}</span>
            </div>
          </Link>
        ))
      )}
    </section>
  );
}

function EmployeeView({ userId, follows }: { userId: string; follows: string[] }) {
  const applied = db().threads.filter((t) => t.applicantId === userId).length;
  return (
    <>
      <section className="grid grid-cols-2 gap-3">
        <Stat icon="bell" label="Following" value={follows.length} />
        <Stat icon="send" label="Applications" value={applied} tone="green" />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="bell" size={18} /> Follow what you do
          </h2>
          <p className="text-sm text-muted">Tap a type to get notified when a new ad appears in it.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const on = follows.includes(c);
            return (
              <form key={c} action={toggleFollow}>
                <input type="hidden" name="category" value={c} />
                <button
                  aria-pressed={on}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-bold transition-colors duration-150 ${on ? "bg-ink text-on-ink" : "bg-surface text-muted hover:bg-red-soft hover:text-ink"}`}
                >
                  <Icon name={CATEGORY_ICONS[c] ?? "grid"} size={17} />
                  <span className="min-w-0 flex-1 truncate">{c}</span>
                  <Icon name={on ? "check" : "plus"} size={14} className={on ? "text-green" : ""} />
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="send" size={18} /> Your applications
        </h2>
        <Applications userId={userId} />
      </section>
    </>
  );
}

/** Ads this person applied to (workers and clients alike). */
function Applications({ userId }: { userId: string }) {
  const threads = db().threads.filter((t) => t.applicantId === userId).sort((a, b) => b.updatedAt - a.updatedAt);
  if (threads.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nothing yet. <Link href="/" className="font-bold text-accent">Browse the feed</Link>
      </p>
    );
  }
  return (
    <>
      {threads.map((t) => (
        <Link key={t.id} href="/inbox" className="card flex items-center gap-3 hover:bg-red-soft">
          <span className="min-w-0 flex-1 truncate font-bold">{t.adTitle}</span>
          <span className="text-xs font-semibold text-muted">
            {t.messages.length > 1 ? `${t.messages.length - 1} repl${t.messages.length === 2 ? "y" : "ies"}` : "Awaiting reply"}
          </span>
        </Link>
      ))}
    </>
  );
}

function Stat({ icon, label, value, tone }: { icon: IconName; label: string; value: number; tone?: "green" }) {
  return (
    <div className="card flex items-center gap-3">
      <Icon name={icon} size={22} className={tone === "green" ? "text-green" : "text-muted"} />
      <div>
        <p className={`text-2xl font-extrabold leading-none ${tone === "green" ? "text-green" : ""}`}>{value}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
      </div>
    </div>
  );
}
