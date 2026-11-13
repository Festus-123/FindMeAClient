import Link from "next/link";
import { removeAd, toggleSuspend } from "../actions/admin";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { naira } from "@/lib/pricing";
import { findUser, isLive } from "@/lib/service";

export default async function AdminPage() {
  await requireUser(["admin"], "/admin");
  const store = db();
  const revenue = store.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const users = store.users.filter((u) => u.role !== "admin");
  const ads = [...store.ads].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="fade-in space-y-10">
      <h1 className="text-2xl font-extrabold">Admin</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Users", users.length],
          ["Live ads", store.ads.filter(isLive).length],
          ["Applications", store.threads.length],
          ["Revenue", naira(revenue)],
        ].map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Ads</h2>
        {ads.length === 0 && <p className="text-sm text-muted">No ads yet.</p>}
        {ads.map((ad) => (
          <div key={ad.id} className="card flex flex-wrap items-center gap-3 !py-3">
            <div className="min-w-0 flex-1">
              <Link href={`/ads/${ad.id}`} className="block truncate font-bold hover:text-accent">{ad.title}</Link>
              <p className="text-xs font-semibold text-muted">
                {findUser(ad.ownerId)?.name} · {ad.status.replace("_", " ")} · {ad.views} views
              </p>
            </div>
            <form action={removeAd}>
              <input type="hidden" name="adId" value={ad.id} />
              <button className="btn btn-red !py-2">Remove</button>
            </form>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Users</h2>
        {users.map((u) => (
          <div key={u.id} className="card flex flex-wrap items-center gap-3 !py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{u.name}</p>
              <p className="text-xs font-semibold text-muted">{u.email} · {u.role}{u.suspended ? " · suspended" : ""}</p>
            </div>
            <form action={toggleSuspend}>
              <input type="hidden" name="userId" value={u.id} />
              <button className={`btn !py-2 ${u.suspended ? "btn-green" : "btn-soft"}`}>{u.suspended ? "Restore" : "Suspend"}</button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
