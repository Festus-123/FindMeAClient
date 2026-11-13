/** The one place the name is written. Use <Logo /> wherever "FindMeAClient" appears so the colours never drift. */
export default function Logo({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className={onDark ? "text-white" : ""}>Find</span>
      <span className="text-blue">Me</span>
      <span className="text-red">A</span>
      <span className="text-green">Client</span>
    </span>
  );
}
