import Link from "next/link";
import RankBadge from "../_components/RankBadge";
import { Badge } from "../_components/ui";
import { hasBadge } from "@/lib/auth";
import { weekKey } from "@/lib/db";
import { topAds, topClients } from "@/lib/service";

export const metadata = { title: "Leaderboard · Find Me A Client" };

export default function LeaderboardPage() {
  const today = topAds(5, true);
  const allTime = topAds(5, false);
  const clients = topClients();

  return (
    <div className="fade-in space-y-10">
      <header>
        <h1 className="text-2xl font-extrabold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">Top 5 in each list. Ads move when they expire, client credits stay for the week.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <AdBoard title="Most viewed today" rows={today} empty="No views yet today." />
        <AdBoard title="Most viewed live ads" rows={allTime} empty="No views yet." />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-extrabold">Clients this week</h2>
          <p className="text-xs font-semibold text-muted">{weekKey()} · credits from views, applications and shares</p>
        </div>
        {clients.length === 0 ? (
          <p className="text-sm text-muted">No credits yet this week.</p>
        ) : (
          <ol className="space-y-2">
            {clients.map((c, i) => (
              <li key={c.user.id} className="card flex items-center gap-3 !py-3">
                <Rank n={i + 1} />
                <span className="flex min-w-0 flex-1 items-center gap-2 font-bold">
                  <span className="truncate">{c.user.name}</span>
                  {hasBadge(c.user) && <Badge />}
                </span>
                <span className="text-xs font-semibold text-muted">{c.activeAds} live</span>
                <span className="text-lg font-extrabold text-green">{c.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Rank({ n }: { n: number }) {
  return <RankBadge n={n} />;
}

function AdBoard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: ReturnType<typeof topAds>;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ol className="space-y-2">
          {rows.map(({ ad, count }, i) => (
            <li key={ad.id}>
              <Link href={`/ads/${ad.id}`} className="card flex items-center gap-3 !py-3 hover:bg-red-soft">
                <Rank n={i + 1} />
                <span className="min-w-0 flex-1 truncate font-bold">{ad.title}</span>
                <span className="text-sm font-extrabold">{count}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
