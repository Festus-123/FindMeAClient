import Link from "next/link";
import AdCard from "./_components/AdCard";
import PostAdButton from "./_components/PostAdButton";
import RankBadge from "./_components/RankBadge";
import Icon, { CATEGORY_ICONS } from "./_components/Icon";
import { getUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/config";
import { buildFeed } from "@/lib/feed";
import { topAds } from "@/lib/service";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const user = await getUser();
  const activeCategory = (CATEGORIES as readonly string[]).includes(category) ? category : "";
  const { ads, freshIds } = buildFeed(user, { q: q.slice(0, 80), category: activeCategory });
  const trending = topAds(5, true);

  const chip = (label: string, value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("category", value);
    const active = activeCategory === value;
    return (
      <Link
        key={label}
        href={`/?${params.toString()}`}
        className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide transition-colors duration-150 ${active ? "bg-ink text-on-ink" : "bg-surface text-muted hover:bg-red-soft hover:text-ink"}`}
      >
        <Icon name={value ? (CATEGORY_ICONS[value] ?? "grid") : "grid"} size={15} />
        {label}
      </Link>
    );
  };

  const liveCount = ads.length;

  return (
    <div className="space-y-8">
      <section className="fade-in relative overflow-hidden bg-ink text-on-ink">
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-2/5 md:grid md:grid-cols-3">
          <div className="bg-red" />
          <div className="bg-blue" />
          <div className="bg-green" />
        </div>
        <div className="relative max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em]">
            <Icon name="flame" size={16} /> Live for 24 hours or more
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Post it today.<br />Meet the people <span className="text-red">who want it.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base opacity-80">
            Jobs, roles and services from real clients. Browse {liveCount} live ad{liveCount === 1 ? "" : "s"} below, or put your own in front of the right people.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PostAdButton role={user?.role ?? "guest"} className="btn bg-paper text-ink hover:bg-red hover:text-white" />
            <a href="#ads" className="btn border-2 border-current">
              Browse ads <Icon name="arrow" size={16} />
            </a>
          </div>
        </div>
      </section>

      <form action="/" className="flex gap-0">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search roles, skills or services…"
          className="field"
          aria-label="Search ads"
        />
        <button className="btn btn-blue" aria-label="Search"><Icon name="search" size={16} /> <span className="hidden sm:inline">Search</span></button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
        {chip("All", "")}
        {CATEGORIES.map((c) => chip(c, c))}
      </div>

      {user && freshIds.size > 0 && (
        <p className=" bg-green-soft px-4 py-3 text-sm font-semibold text-green">
          {freshIds.size} ad{freshIds.size === 1 ? "" : "s"} you haven&apos;t seen yet are at the top.
        </p>
      )}

      <div id="ads" className="grid scroll-mt-24 gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Ads" className="grid content-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ads.length === 0 ? (
            <div className="card col-span-full py-14 text-center">
              <p className="text-lg font-extrabold">{q || activeCategory ? "Nothing matches yet" : "No ads are up right now"}</p>
              <p className="mt-1 text-sm text-muted">
                {q || activeCategory ? "Try different words or clear the filter." : "Ads stay up for 24 hours or more, so check back soon."}
              </p>
              <div className="mt-5"><PostAdButton role={user?.role ?? "guest"} /></div>
            </div>
          ) : (
            ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} fresh={freshIds.has(ad.id)} />
            ))
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide"><Icon name="flame" size={16} className="text-red" /> Trending today</h2>
            {trending.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Views will show up here.</p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {trending.map(({ ad, count }, i) => (
                  <li key={ad.id} className="flex items-start gap-3">
                    <RankBadge n={i + 1} size="sm" />
                    <Link href={`/ads/${ad.id}`} className="min-w-0 flex-1 text-sm font-semibold leading-snug hover:text-accent">
                      <span className="line-clamp-2">{ad.title}</span>
                      <span className="text-xs font-medium text-muted">{count} view{count === 1 ? "" : "s"}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
            <Link href="/leaderboard" className="mt-4 flex items-center gap-1.5 text-sm font-bold text-accent">Full leaderboard <Icon name="arrow" size={14} /></Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
