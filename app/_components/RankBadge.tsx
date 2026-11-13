import Icon from "./Icon";

const MEDALS = [
  { name: "1st", bg: "#f5b301", label: "Gold, first place" },
  { name: "2nd", bg: "#b4bccd", label: "Silver, second place" },
  { name: "3rd", bg: "#cd7f32", label: "Bronze, third place" },
];

/** Gold, silver and bronze medals for the top three; plain numbers after that. */
export default function RankBadge({ n, size = "md" }: { n: number; size?: "sm" | "md" }) {
  const medal = MEDALS[n - 1];
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  if (!medal) {
    return <span className={`flex ${box} shrink-0 items-center justify-center bg-surface-2 text-xs font-extrabold text-muted`}>{n}</span>;
  }
  return (
    <span
      role="img"
      aria-label={medal.label}
      title={medal.label}
      className={`relative flex ${box} shrink-0 items-center justify-center text-[#0b0f1e]`}
      style={{ background: medal.bg }}
    >
      <Icon name="medal" size={size === "sm" ? 16 : 20} />
      <span className="absolute -bottom-1 -right-1 bg-ink px-1 text-[9px] font-extrabold leading-4 text-on-ink">{n}</span>
    </span>
  );
}
