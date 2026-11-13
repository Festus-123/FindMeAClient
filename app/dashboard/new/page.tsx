import AdForm from "../../_components/AdForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewAdPage() {
  const user = await requireUser(["client"], "/dashboard/new");

  // How many ads the client already has per cause, so the form can preview the exponential price.
  const causeCounts: Record<string, number> = {};
  for (const ad of db().ads) {
    if (ad.ownerId !== user.id) continue;
    const key = ad.cause.trim().toLowerCase();
    causeCounts[key] = (causeCounts[key] ?? 0) + 1;
  }

  return (
    <div className="fade-in mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Post an ad</h1>
        <p className="mt-1 text-sm text-muted">
          Your ad is shown to every user at least once and stays up for 24 hours or more.
        </p>
      </div>
      <AdForm freeAdAvailable={!user.freeAdUsed} causeCounts={causeCounts} />
    </div>
  );
}
