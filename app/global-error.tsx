"use client";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center" }}>
        <div>
          <h1 style={{ color: "#ef2b2b" }}>Something went wrong</h1>
          <button onClick={() => unstable_retry()} style={{ background: "#0b0f1e", color: "#fff", border: 0, borderRadius: 0, padding: "12px 20px", fontWeight: 700, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
