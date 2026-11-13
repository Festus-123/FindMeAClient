import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyExternal, ApplyForm, FollowButton, ShareButton, ViewTracker } from "../../_components/AdActions";
import Icon, { CATEGORY_ICONS } from "../../_components/Icon";
import { Badge } from "../../_components/ui";
import { getUser, hasBadge } from "@/lib/auth";
import { db } from "@/lib/db";
import { imageSrc, timeLeft } from "@/lib/format";
import { can, isHost } from "@/lib/permissions";
import { findAd, findUser, isLive } from "@/lib/service";

export default async function AdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = findAd(id);
  if (!ad) notFound();

  const user = await getUser();
  const host = isHost(user, ad);
  if (!isLive(ad)) {
    // Expired ads are private to their hosts (who can restore them).
    if (host) redirect(`/dashboard/ads/${ad.id}`);
    notFound();
  }

  const owner = findUser(ad.ownerId);
  const alreadyApplied = !!user && db().threads.some((t) => t.adId === ad.id && t.applicantId === user.id);

  return (
    <article className="fade-in mx-auto max-w-4xl space-y-6">
      <ViewTracker adId={ad.id} />
      <Link href="/" className="text-sm font-bold text-muted hover:text-accent"><span className="flex items-center gap-1.5"><Icon name="back" size={15} /> Back to feed</span></Link>

      {ad.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc(ad.image)} alt={ad.title} className="max-h-[28rem] w-full bg-surface object-cover" />
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-on-ink"><Icon name={CATEGORY_ICONS[ad.category] ?? "grid"} size={13} /> {ad.category}</span>
          <span className="flex items-center gap-1.5 bg-green-soft px-3 py-1.5 text-green"><Icon name="clock" size={13} /> {timeLeft(ad.expiresAt)}</span>
        </div>
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{ad.title}</h1>
        <p className="flex items-center gap-2 text-sm font-semibold text-muted">
          Posted by {owner?.name ?? "a client"} {owner && hasBadge(owner) && <Badge />}
        </p>
      </header>

      <p className="whitespace-pre-wrap leading-relaxed">{ad.description}</p>

      {ad.details.length > 0 && (
        <dl className="card grid gap-3 sm:grid-cols-2">
          {ad.details.map((d, i) => (
            <div key={i}>
              <dt className="text-xs font-bold uppercase tracking-wide text-muted">{d.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-2">
        <ShareButton adId={ad.id} title={ad.title} canShare={can(user, "ad.share")} />
        <FollowButton
          category={ad.category}
          following={!!user && user.follows.includes(ad.category)}
          allowed={can(user, "ad.follow")}
        />
        {ad.adoptable && ad.image && (
          <a
            href={can(user, "ad.download") ? `/uploads/${ad.image}?download=1` : `/register?next=/ads/${ad.id}`}
            className="btn btn-soft"
          >
            <Icon name="download" size={15} /> {can(user, "ad.download") ? "Download image" : "Join to download image"}
          </a>
        )}
      </div>

      <section className="card space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide"><Icon name="send" size={15} /> Apply</h2>
        {host ? (
          <p className="text-sm font-semibold">
            This is your ad.{" "}
            <Link href={`/dashboard/ads/${ad.id}`} className="text-accent">See stats and responses</Link>
          </p>
        ) : alreadyApplied ? (
          <p className="text-sm font-semibold text-green">
            You applied. Replies will show up in your <Link href="/inbox" className="underline">inbox</Link>.
          </p>
        ) : user && !can(user, "ad.apply") ? (
          <p className="text-sm font-semibold text-muted">Admin accounts can&apos;t apply to ads.</p>
        ) : ad.applyMethod && ad.applyMethod !== "inbox" && ad.applyValue ? (
          <ApplyExternal adId={ad.id} method={ad.applyMethod} value={ad.applyValue} allowed={can(user, "ad.apply")} />
        ) : (
          <ApplyForm adId={ad.id} allowed={can(user, "ad.apply")} />
        )}
      </section>
    </article>
  );
}
