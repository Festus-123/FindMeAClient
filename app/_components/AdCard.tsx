import Link from "next/link";
import Icon, { CATEGORY_ICONS } from "./Icon";
import { imageSrc, timeLeft } from "@/lib/format";
import type { Ad } from "@/lib/types";

export default function AdCard({ ad, fresh = false }: { ad: Ad; fresh?: boolean }) {
  const left = ad.expiresAt - Date.now();
  const urgent = left < 3 * 3600_000;
  const location = ad.details.find((d) => d.label === "Location")?.value;
  const pay = ad.details.find((d) => d.label === "Pay / Budget")?.value;
  return (
    <Link href={`/ads/${ad.id}`} className="tile fade-in group flex flex-col bg-surface">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {ad.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc(ad.image)} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Icon name={CATEGORY_ICONS[ad.category] ?? "grid"} size={48} />
          </div>
        )}
        <span className="absolute left-0 top-0 flex items-center gap-1.5 bg-ink px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-on-ink">
          <Icon name={CATEGORY_ICONS[ad.category] ?? "grid"} size={13} /> {ad.category}
        </span>
        {fresh && (
          <span className="absolute right-0 top-0 flex items-center gap-1 bg-green px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
            <Icon name="zap" size={12} /> New
          </span>
        )}
        <span
          className={`absolute bottom-0 right-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${urgent ? "bg-red text-white" : "bg-paper text-ink"}`}
        >
          <Icon name="clock" size={13} /> {timeLeft(ad.expiresAt)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-extrabold leading-snug group-hover:text-accent">{ad.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{ad.description}</p>
        {(location || pay) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
            {location && (
              <span className="flex items-center gap-1.5">
                <Icon name="pin" size={13} /> {location}
              </span>
            )}
            {pay && (
              <span className="flex items-center gap-1.5 text-green">
                <Icon name="briefcase" size={13} /> {pay}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 text-xs font-bold text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="eye" size={13} /> {ad.views}
          </span>
          <span className="flex items-center gap-1 text-ink group-hover:text-accent">
            View <Icon name="arrow" size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
