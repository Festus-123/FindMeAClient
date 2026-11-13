"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="fade-in flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl font-extrabold text-red">Oops</p>
      <h1 className="text-xl font-extrabold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">It&apos;s on our side. Try again, and if it keeps happening come back in a moment.</p>
      <button onClick={() => unstable_retry()} className="btn btn-red mt-2">Try again</button>
    </div>
  );
}
