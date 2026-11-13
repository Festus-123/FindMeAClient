import Link from "next/link";
import { logout } from "../actions/auth";
import { getUser, hasBadge } from "@/lib/auth";
import { db } from "@/lib/db";
import Icon from "./Icon";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { Badge } from "./ui";

export default async function Header() {
  const user = await getUser();
  let unread = 0;
  if (user) {
    const store = db();
    unread =
      store.notifications.filter((n) => n.userId === user.id && !n.read).length +
      store.threads.filter((t) => t.unreadFor.includes(user.id)).length;
  }

  const navLink = "flex items-center gap-2 px-3 py-2 hover:bg-surface";

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
        <Link href="/" aria-label="FindMeAClient home">
          <Logo className="text-lg" />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm font-semibold text-muted sm:flex">
          <Link href="/" className={navLink}>
            <Icon name="home" size={16} /> Feed
          </Link>
          <Link href="/leaderboard" className={navLink}>
            <Icon name="trophy" size={16} /> Leaderboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/inbox" className="btn btn-soft relative !px-3 !py-2" aria-label="Inbox">
                <Icon name="mail" size={16} />
                <span className="hidden sm:inline">Inbox</span>
                {unread > 0 && (
                  <span className="bg-red px-1.5 text-[11px] leading-5 text-white">{unread > 99 ? "99+" : unread}</span>
                )}
              </Link>
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className={`${navLink} font-semibold`}>
                <Icon name="user" size={16} />
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                {hasBadge(user) && <Badge />}
              </Link>
              <form action={logout}>
                <button className={`${navLink} font-semibold text-muted`} aria-label="Sign out" title="Sign out">
                  <Icon name="logout" size={16} />
                  <span className="hidden md:inline">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${navLink} font-semibold`}>
                Sign in
              </Link>
              <Link href="/register" className="btn btn-blue !py-2">
                Join <Icon name="arrow" size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-1 px-4 pb-2 text-sm font-semibold text-muted sm:hidden">
        <Link href="/" className={navLink}>
          <Icon name="home" size={16} /> Feed
        </Link>
        <Link href="/leaderboard" className={navLink}>
          <Icon name="trophy" size={16} /> Leaderboard
        </Link>
      </nav>
    </header>
  );
}
