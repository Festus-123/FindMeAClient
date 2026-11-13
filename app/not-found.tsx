import Link from "next/link";
import Icon from "./_components/Icon";

export default function NotFound() {
  return (
    <div className="fade-in flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="text-xl font-extrabold">We couldn&apos;t find that page</h1>
      <p className="max-w-sm text-sm text-muted">The ad may have ended, or the link is wrong.</p>
      <Link href="/" className="btn btn-blue mt-2"><Icon name="back" size={15} /> Back to the feed</Link>
    </div>
  );
}
