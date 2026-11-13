import { notFound, redirect } from "next/navigation";
import { confirmTestPayment } from "../../actions/pay";
import { SubmitButton } from "../../_components/ui";
import { requireUser } from "@/lib/auth";
import { findPayment, provider } from "@/lib/payments";
import { naira } from "@/lib/pricing";
import { findAd } from "@/lib/service";

const LABEL = {
  ad: "Put your ad up",
  restore: "Restore your ad",
  subscription: "Monthly subscription",
} as const;

export default async function PayPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const user = await requireUser(undefined, `/pay/${ref}`);
  const payment = findPayment(ref);
  if (!payment || payment.userId !== user.id) notFound();
  if (payment.status === "paid") redirect(payment.adId ? `/dashboard/ads/${payment.adId}` : "/dashboard");

  const ad = payment.adId ? findAd(payment.adId) : undefined;
  const canConfirm = provider.simulated && process.env.NODE_ENV !== "production";

  return (
    <div className="fade-in mx-auto max-w-sm space-y-6 pt-6">
      <header>
        <h1 className="text-2xl font-extrabold">{LABEL[payment.kind]}</h1>
        {ad && <p className="mt-1 text-sm text-muted">{ad.title}</p>}
      </header>
      <div className="card space-y-1 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Amount due</p>
        <p className="text-4xl font-extrabold">{naira(payment.amount)}</p>
      </div>
      {canConfirm ? (
        <form action={confirmTestPayment} className="space-y-3">
          <input type="hidden" name="ref" value={payment.ref} />
          <SubmitButton className="btn btn-green w-full" pendingText="Confirming…">Pay {naira(payment.amount)} (test mode)</SubmitButton>
          <p className="text-center text-xs font-semibold text-muted">
            Test mode: no money moves. A live payment provider needs to be connected before launch.
          </p>
        </form>
      ) : (
        <p className=" bg-red-soft px-4 py-3 text-sm font-semibold text-red">
          Payments aren&apos;t available yet. Please try again later.
        </p>
      )}
    </div>
  );
}
