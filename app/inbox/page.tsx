import Link from "next/link";
import ThreadReply from "../_components/ThreadReply";
import { markAllRead } from "../actions/engage";
import { requireUser } from "@/lib/auth";
import { db, save } from "@/lib/db";
import { ago } from "@/lib/format";
import { findAd, findUser, isLive } from "@/lib/service";

export default async function InboxPage() {
  const user = await requireUser(undefined, "/inbox");
  const store = db();

  const notifications = store.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.at - a.at).slice(0, 30);
  const threads = store.threads
    .filter((t) => t.applicantId === user.id || t.hostIds.includes(user.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // Snapshot what was unread so it can be highlighted, then mark the threads read.
  const unreadThreads = new Set(threads.filter((t) => t.unreadFor.includes(user.id)).map((t) => t.id));
  if (unreadThreads.size > 0) {
    for (const t of threads) t.unreadFor = t.unreadFor.filter((id) => id !== user.id);
    save();
  }

  return (
    <div className="fade-in grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section className="space-y-4">
        <h1 className="text-2xl font-extrabold">Messages</h1>
        {threads.length === 0 ? (
          <div className="card text-center text-sm text-muted">
            No messages yet. Responses to your ads and replies to your applications appear here.
          </div>
        ) : (
          threads.map((t) => {
            const ad = findAd(t.adId);
            const open = !!ad && isLive(ad);
            const applicant = findUser(t.applicantId)?.name ?? "Applicant";
            return (
              <article key={t.id} className={`card ${unreadThreads.has(t.id) ? "bg-surface-2" : ""}`}>
                <header className="mb-3 flex flex-wrap items-center gap-2">
                  <Link href={open ? `/ads/${t.adId}` : `/dashboard/ads/${t.adId}`} className="font-extrabold hover:text-accent">
                    {t.adTitle}
                  </Link>
                  {!open && <span className=" bg-red-soft px-2 py-0.5 text-xs font-bold text-red">Ended</span>}
                  <span className="ml-auto text-xs font-semibold text-muted">with {t.applicantId === user.id ? "the client" : applicant}</span>
                </header>
                <ul className="space-y-2">
                  {t.messages.map((m, i) => {
                    const mine = m.from === user.id;
                    return (
                      <li key={i} className={`max-w-[85%]  px-4 py-2.5 text-sm ${mine ? "ml-auto bg-ink text-on-ink" : "bg-paper"}`}>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className={`mt-1 text-[11px] font-semibold ${mine ? "text-white/70" : "text-muted"}`}>
                          {mine ? "You" : (findUser(m.from)?.name ?? "User")} · {ago(m.at)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                {open ? (
                  <ThreadReply threadId={t.id} />
                ) : (
                  <p className="mt-3 text-xs font-semibold text-muted">Replies are closed because the ad has ended.</p>
                )}
              </article>
            );
          })
        )}
      </section>

      <aside className="space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-extrabold">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <form action={markAllRead} className="ml-auto">
              <button className="text-sm font-bold text-accent">Mark all read</button>
            </form>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted">Nothing yet. Follow a type of ad to get notified.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className={`block  px-4 py-3 text-sm font-semibold transition-colors duration-150 hover:bg-red-soft ${n.read ? "bg-surface text-muted" : "bg-surface-2 text-ink"}`}>
                  {n.text}
                  <span className="block text-xs font-medium text-muted">{ago(n.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
