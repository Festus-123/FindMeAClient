import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAd, restoreAd } from "../../../actions/ads";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ago, timeLeft } from "@/lib/format";
import { canPayOrDelete, canSeeAdStats } from "@/lib/permissions";
import { naira, restorePrice } from "@/lib/pricing";
import { findAd, findUser } from "@/lib/service";

export default async function ManageAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["client", "admin"], `/dashboard/ads/${id}`);
  const ad = findAd(id);
  // Same response for "missing" and "not yours" so ids can't be probed.
  if (!ad || !canSeeAdStats(user, ad)) notFound();

  const owner = canPayOrDelete(user, ad);
  const hosts = [ad.ownerId, ...ad.cohostIds].map((h) => findUser(h)?.name).filter(Boolean);
  const threads = db().threads.filter((t) => t.adId === ad.id);
  const pendingPay = db().payments.find((p) => p.adId === ad.id && p.status === "pending" && p.userId === user.id);
  const daysLeft = Math.max(0, Math.ceil((ad.purgeAt - Date.now()) / 86_400_000));

  return (
    <div className="fade-in mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard" className="text-sm font-bold text-muted hover:text-accent">← Dashboard</Link>

      <header className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span
            className={` px-2.5 py-1 ${ad.status === "live" ? "bg-green-soft text-green" : ad.status === "expired" ? "bg-red-soft text-red" : "bg-surface-2 text-accent"}`}
          >
            {ad.status === "live" ? timeLeft(ad.expiresAt) : ad.status === "expired" ? "Ended" : "Awaiting payment"}
          </span>
          <span className=" bg-surface px-2.5 py-1 text-muted">{ad.category}</span>
        </div>
        <h1 className="text-2xl font-extrabold">{ad.title}</h1>
        <p className="text-sm text-muted">Hosts: {hosts.join(", ")}</p>
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Views", ad.views],
          ["Applications", ad.applies],
          ["Shares", ad.shares],
        ].map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
          </div>
        ))}
      </section>

      {ad.status === "pending_payment" && owner && pendingPay && (
        <Link href={`/pay/${pendingPay.ref}`} className="btn btn-blue w-full">
          Pay {naira(pendingPay.amount)} to put this ad up
        </Link>
      )}

      {ad.status === "expired" && (
        <section className="card space-y-3 bg-red-soft">
          <h2 className="font-extrabold">This ad has ended</h2>
          <p className="text-sm">
            It will be deleted in {daysLeft} day{daysLeft === 1 ? "" : "s"}. Restoring brings it back for {ad.hours} hours
            {owner ? ` for ${naira(restorePrice(ad.price))}.` : "."}
          </p>
          {owner ? (
            <div className="flex flex-wrap gap-2">
              <form action={restoreAd}>
                <input type="hidden" name="adId" value={ad.id} />
                <button className="btn btn-blue">Yes, restore it</button>
              </form>
              <form action={deleteAd}>
                <input type="hidden" name="adId" value={ad.id} />
                <button className="btn btn-red">No, delete it</button>
              </form>
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted">Only the owner can restore or delete this ad.</p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Responses</h2>
        {threads.length === 0 ? (
          <p className="text-sm text-muted">No one has responded yet.</p>
        ) : (
          threads.map((t) => (
            <Link key={t.id} href="/inbox" className="card block hover:bg-red-soft">
              <p className="font-bold">{findUser(t.applicantId)?.name ?? "Applicant"}</p>
              <p className="line-clamp-2 text-sm text-muted">{t.messages[0]?.text}</p>
              <p className="mt-1 text-xs font-semibold text-muted">{ago(t.updatedAt)}</p>
            </Link>
          ))
        )}
      </section>

      {ad.status === "live" && (
        <Link href={`/ads/${ad.id}`} className="btn btn-soft">View public page</Link>
      )}
    </div>
  );
}
